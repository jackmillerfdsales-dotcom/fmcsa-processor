GitHub Actions free approach (no credit card required)
-----------------------------------------------------

What this package contains:
- gh_processor.js   : Node script that reads mcs.txt and fetches snapshot pages, extracts MC/phone/email, writes CSV to output/
- package.json      : Node dependencies (node-fetch v2, minimist)
- .github/workflows/processor.yml : GitHub Actions workflow to run script on schedule (every 5 minutes by default)
- README instructions below.

How it works:
1. Create a **public** GitHub repository and push these files, plus a file named `mcs.txt` with one MC per line.
2. GitHub Actions for public repos are free (no minutes limit) — the workflow will run on schedule and process the MCs.
3. Results are uploaded as workflow **artifacts** (download from Actions UI) under the name `fmcsa-results`.
4. If you need persistent storage, you can add a step to commit output CSVs back to the repo (requires a PAT secret), or upload to an external storage (S3, Google Drive via API).

Notes & tuning:
- Keep batch size moderate. This script processes all MCs in mcs.txt sequentially with a delay between requests; adjust `--delay` to avoid rate limits.
- For very large lists (thousands), consider splitting into batches (create multiple workflows or chunk the file).
- This approach avoids entering any credit card info (GitHub public repo free).

If you want, I can:
- Create a version that chunks work and marks processed items,
- Or add a step to commit results back into the repo (requires you to create a GitHub PAT and set it as a repository secret).
