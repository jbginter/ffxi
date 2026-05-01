#!/usr/bin/env python3
"""
Search the offline BG Wiki FFXI data directory.

Usage:
  python3 search.py <query>          — full-text search through wikitext
  python3 search.py --title <query>  — search page titles only
  python3 search.py --page <title>   — print a specific page's wikitext
  python3 search.py --stats          — show download statistics
"""

import json
import sys
import os
import re
from pathlib import Path

PAGES_DIR = Path(__file__).parent / "data" / "pages"
INDEX_FILE = Path(__file__).parent / "data" / "index.json"
PROGRESS_FILE = Path(__file__).parent / "data" / "progress.json"

RESET  = "\033[0m"
BOLD   = "\033[1m"
YELLOW = "\033[33m"
CYAN   = "\033[36m"
GREEN  = "\033[32m"


def _safe(name: str) -> str:
    for ch in r'/\:*?"<>|':
        name = name.replace(ch, "_")
    return name


def page_path(title: str) -> Path:
    first = title[0].upper() if title else "_"
    if not first.isalpha():
        first = "_"
    return PAGES_DIR / first / (_safe(title) + ".json")


def load_page(title: str) -> dict | None:
    path = page_path(title)
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def all_pages():
    """Yield all downloaded page dicts."""
    for letter_dir in sorted(PAGES_DIR.iterdir()):
        if not letter_dir.is_dir():
            continue
        for jf in sorted(letter_dir.iterdir()):
            if jf.suffix == ".json":
                with open(jf, encoding="utf-8") as f:
                    yield json.load(f)


def stats() -> None:
    total = 0
    if INDEX_FILE.exists():
        with open(INDEX_FILE) as f:
            total = len(json.load(f))

    done = 0
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            done = len(json.load(f))

    size_mb = sum(
        f.stat().st_size
        for f in PAGES_DIR.rglob("*.json")
    ) / 1_048_576

    print(f"{BOLD}BG Wiki FFXI offline data{RESET}")
    print(f"  Downloaded : {done:>6,} pages")
    print(f"  Total index: {total:>6,} articles")
    print(f"  Progress   : {100*done/total:.1f}%" if total else "  Progress   : n/a")
    print(f"  Disk usage : {size_mb:.1f} MB")


def search_titles(query: str) -> None:
    pat = re.compile(re.escape(query), re.IGNORECASE)
    hits = []

    if INDEX_FILE.exists():
        with open(INDEX_FILE) as f:
            index = json.load(f)
        hits = [p["title"] for p in index if pat.search(p["title"])]
    else:
        hits = [p["title"] for p in all_pages() if pat.search(p["title"])]

    print(f"{BOLD}{len(hits)} title matches for {query!r}{RESET}\n")
    for t in hits[:50]:
        print(f"  {CYAN}{t}{RESET}")
    if len(hits) > 50:
        print(f"  … and {len(hits)-50} more")


def search_fulltext(query: str, context: int = 1) -> None:
    pat     = re.compile(re.escape(query), re.IGNORECASE)
    results = []

    for page in all_pages():
        text = page.get("wikitext", "")
        lines = text.splitlines()
        snippets = []
        for i, line in enumerate(lines):
            if pat.search(line):
                lo = max(0, i - context)
                hi = min(len(lines), i + context + 1)
                snippets.append((i + 1, "\n".join(lines[lo:hi])))
        if snippets:
            results.append((page["title"], snippets))

    print(f"{BOLD}{len(results)} pages matching {query!r}{RESET}\n")
    for title, snippets in results[:20]:
        print(f"{YELLOW}{title}{RESET}")
        for lineno, snippet in snippets[:3]:
            highlighted = pat.sub(lambda m: f"{GREEN}{m.group()}{RESET}", snippet)
            indented = "\n".join(f"  {l}" for l in highlighted.splitlines())
            print(f"  (line {lineno})")
            print(indented)
        print()

    if len(results) > 20:
        print(f"… and {len(results)-20} more pages. Narrow your query.")


def show_page(title: str) -> None:
    page = load_page(title)
    if page is None:
        # Try case-insensitive scan
        pat = re.compile(r"^" + re.escape(title) + r"$", re.IGNORECASE)
        for p in all_pages():
            if pat.match(p["title"]):
                page = p
                break

    if page is None:
        print(f"Page not found: {title!r}")
        print("Tip: use --title to search for the exact name.")
        sys.exit(1)

    print(f"{BOLD}{CYAN}{page['title']}{RESET}  (updated {page['timestamp']})")
    if page.get("categories"):
        print(f"Categories: {', '.join(page['categories'])}")
    print("─" * 60)
    print(page["wikitext"])


def main() -> None:
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)

    if args[0] == "--stats":
        stats()
    elif args[0] == "--title":
        search_titles(" ".join(args[1:]))
    elif args[0] == "--page":
        show_page(" ".join(args[1:]))
    else:
        search_fulltext(" ".join(args))


if __name__ == "__main__":
    main()
