#!/usr/bin/env python3
"""
BG Wiki FFXI offline mirror.

Uses the MediaWiki API to download wikitext for all articles in batches of 50.
Supports resume: re-run and it picks up where it left off.

Output layout:
  data/index.json        — all page titles + IDs (fetched once)
  data/progress.json     — which titles have been saved (resume state)
  data/pages/<X>/…json  — one JSON file per article, keyed by first letter
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

API_URL   = "https://www.bg-wiki.com/api.php"
OUT_DIR   = Path(__file__).parent / "data"
PAGES_DIR = OUT_DIR / "pages"
INDEX_FILE    = OUT_DIR / "index.json"
PROGRESS_FILE = OUT_DIR / "progress.json"

UA         = "FFXI-Archive/1.0 (personal offline mirror; contact jbginter88@gmail.com)"
BATCH_SIZE = 50
API_DELAY  = 0.5   # seconds between API calls (respectful rate for a JSON API)

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _get(params: dict) -> dict:
    params["format"] = "json"
    params["formatversion"] = "2"
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

# ---------------------------------------------------------------------------
# Step 1 — enumerate all article titles
# ---------------------------------------------------------------------------

def fetch_all_titles(namespace: int = 0) -> list[dict]:
    titles = []
    cont = None
    while True:
        params: dict = {
            "action": "query",
            "list": "allpages",
            "apnamespace": namespace,
            "aplimit": 500,
        }
        if cont:
            params["apcontinue"] = cont

        data = _get(params)
        batch = data["query"]["allpages"]
        titles.extend({"title": p["title"], "pageid": p["pageid"]} for p in batch)
        print(f"  {len(titles)} titles …", end="\r", flush=True)

        if "continue" in data:
            cont = data["continue"]["apcontinue"]
            time.sleep(API_DELAY)
        else:
            break

    print()
    return titles

# ---------------------------------------------------------------------------
# Step 2 — download wikitext in batches
# ---------------------------------------------------------------------------

def fetch_batch(titles: list[str]) -> dict[str, dict]:
    params = {
        "action": "query",
        "prop": "revisions|categories",
        "rvprop": "content|timestamp",
        "rvslots": "main",
        "cllimit": 50,
        "titles": "|".join(titles),
    }
    data = _get(params)

    results = {}
    for page in data["query"]["pages"]:
        if page.get("missing") or "revisions" not in page:
            continue
        rev  = page["revisions"][0]
        cats = [c["title"] for c in page.get("categories", [])]
        results[page["title"]] = {
            "title":     page["title"],
            "pageid":    page["pageid"],
            "wikitext":  rev["slots"]["main"]["content"],
            "timestamp": rev["timestamp"],
            "categories": cats,
        }
    return results

# ---------------------------------------------------------------------------
# Filesystem helpers
# ---------------------------------------------------------------------------

def _safe(name: str) -> str:
    for ch in r'/\:*?"<>|':
        name = name.replace(ch, "_")
    return name

def page_path(title: str) -> Path:
    first = title[0].upper() if title else "_"
    if not first.isalpha():
        first = "_"
    return PAGES_DIR / first / (_safe(title) + ".json")

def save_page(data: dict) -> None:
    path = page_path(data["title"])
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------

def load_progress() -> set[str]:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()

def save_progress(done: set[str]) -> None:
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(done), f, ensure_ascii=False)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    # --- index ---
    if INDEX_FILE.exists():
        with open(INDEX_FILE) as f:
            all_pages = json.load(f)
        print(f"Loaded existing index: {len(all_pages)} pages")
    else:
        print("Fetching full page list from MediaWiki API …")
        all_pages = fetch_all_titles(namespace=0)
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(all_pages, f, ensure_ascii=False, indent=2)
        print(f"Saved index: {len(all_pages)} articles → {INDEX_FILE}")

    # --- resume ---
    done = load_progress()
    remaining = [p for p in all_pages if p["title"] not in done]
    total = len(all_pages)
    print(f"Progress: {len(done)}/{total} done, {len(remaining)} remaining\n")

    if not remaining:
        print("All pages already downloaded.")
        return

    batches   = [remaining[i : i + BATCH_SIZE] for i in range(0, len(remaining), BATCH_SIZE)]
    n_batches = len(batches)
    errors    = 0

    for i, batch in enumerate(batches):
        pct    = 100 * len(done) / total
        titles = [p["title"] for p in batch]

        try:
            pages_data = fetch_batch(titles)
            for pd in pages_data.values():
                save_page(pd)
                done.add(pd["title"])
        except Exception as exc:
            errors += 1
            print(f"\n  [batch {i+1}/{n_batches}] error: {exc}")
            time.sleep(5)
            continue

        save_progress(done)

        print(
            f"  batch {i+1:>5}/{n_batches}  "
            f"{len(done):>6}/{total} pages  "
            f"({pct:5.1f}%)  "
            f"errors={errors}",
            end="\r",
            flush=True,
        )
        time.sleep(API_DELAY)

    print(f"\n\nDone. {len(done)} pages saved to {PAGES_DIR}  (errors={errors})")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted — progress saved, re-run to continue.")
        sys.exit(0)
