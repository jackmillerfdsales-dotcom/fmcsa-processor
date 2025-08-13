/**
 * gh_processor.js
 * - Reads 'mcs.txt' from repo root (one MC per line)
 * - Processes in batches (concurrency configurable)
 * - Fetches FMCAS snapshot pages and extracts MC/phone/email (lightweight)
 * - Writes results CSV to ./output/results_<timestamp>.csv
 *
 * Usage: node gh_processor.js --concurrency=4 --delay=300 --batchSize=500
 */
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const argv = require('minimist')(process.argv.slice(2));
const concurrency = Number(argv.concurrency) || 4;
const delay = Number(argv.delay) || 300; // ms between requests
const batchSize = Number(argv.batchSize) || 500;

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function mcToSnapshotUrl(mc){
  return `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${encodeURIComponent(mc.replace(/\s+/g,''))}`;
}

function extractFromHtml(html, url){
  const result = { mcNumber:'', email:'', phone:'', url };
  const mcMatch = html.match(/MC[-\s]?(\d{3,7})/i);
  if (mcMatch) result.mcNumber = 'MC-' + mcMatch[1];
  const emailMatch = html.match(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i);
  if (emailMatch) result.email = emailMatch[1];
  const phoneMatch = html.match(/\(?\d{3}\)?[\s\-]*\d{3}[-\s]*\d{4}/);
  if (phoneMatch) result.phone = phoneMatch[0];
  return result;
}

async function processMc(mc){
  const url = mcToSnapshotUrl(mc);
  try {
    const resp = await fetch(url, { timeout: 15000 });
    const html = await resp.text();
    return extractFromHtml(html, url);
  } catch(e){
    return { mcNumber:'', email:'', phone:'', url, error: e.message || 'fetch_error' };
  }
}

async function run(){
  if (!fs.existsSync('mcs.txt')){
    console.error('mcs.txt not found in repo root. Create one MC per line.');
    process.exit(1);
  }
  const raw = fs.readFileSync('mcs.txt','utf8');
  const mcs = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if (!mcs.length){ console.error('No MC numbers found'); process.exit(1); }
  const outDir = path.join('output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
  const ts = Date.now();
  const outFile = path.join(outDir, `results_${ts}.csv`);
  const headers = ['mcOriginal','mcNumber','email','phone','url','error'];
  fs.writeFileSync(outFile, headers.join(',') + '\n');
  console.log('Starting processing', mcs.length, 'MCs');
  for (let i=0;i<mcs.length;i++){
    const mc = mcs[i];
    const res = await processMc(mc);
    const row = [mc, res.mcNumber||'', res.email||'', res.phone||'', res.url||'', res.error||''].map(s=>`"${(s||'').toString().replace(/"/g,'""')}"`).join(',');
    fs.appendFileSync(outFile, row + '\n');
    if ((i+1) % 10 === 0) console.log('Processed', i+1, '/', mcs.length);
    await sleep(delay);
  }
  console.log('Done. Output CSV:', outFile);
}
run();
