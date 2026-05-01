#!/usr/bin/env python3
"""
Parse every weapon-skill page from the scraped BG-wiki data and
regenerate backend/data/weapon_skills.py.

Run from the project root:
  python3 generate_ws.py
"""

import json
import re
import sys
from pathlib import Path

PAGES_DIR = Path(__file__).parent / "data" / "pages"
OUT_FILE  = Path(__file__).parent / "backend" / "data" / "weapon_skills.py"

# ── Known FFXI job codes ──────────────────────────────────────────────────────
JOBS = {
    "WAR","MNK","WHM","BLM","RDM","THF","PLD","DRK","BST","BRD",
    "RNG","SAM","NIN","DRG","SMN","BLU","COR","PUP","DNC","SCH","GEO","RUN",
}

# ── Weapon-type categories → display name ────────────────────────────────────
WEAPON_CATS = {
    "Category:Hand-to-Hand": "Hand-to-Hand",
    "Category:Dagger":       "Dagger",
    "Category:Sword":        "Sword",
    "Category:Great Sword":  "Great Sword",
    "Category:Axe":          "Axe",
    "Category:Great Axe":    "Great Axe",
    "Category:Scythe":       "Scythe",
    "Category:Polearm":      "Polearm",
    "Category:Katana":       "Katana",
    "Category:Great Katana": "Great Katana",
    "Category:Club":         "Club",
    "Category:Staff":        "Staff",
    "Category:Archery":      "Archery",
    "Category:Marksmanship": "Marksmanship",
    "Category:Throwing":     "Throwing",
}

# ── SC-property categories → prop ID ─────────────────────────────────────────
SC_CATS = {
    "Category:Liquefaction":  "liquefaction",
    "Category:Scission":      "scission",
    "Category:Reverberation": "reverberation",
    "Category:Detonation":    "detonation",
    "Category:Induration":    "induration",
    "Category:Impaction":     "impaction",
    "Category:Transfixion":   "transfixion",
    "Category:Compression":   "compression",
    "Category:Fusion":        "fusion",
    "Category:Distortion":    "distortion",
    "Category:Gravitation":   "gravitation",
    "Category:Fragmentation": "fragmentation",
    "Category:Light":         "light",
    "Category:Darkness":      "darkness",
}

# Preserve the sc1/sc2/sc3 order from the template (categories are unordered)
SC_NAME_MAP = {v.lower(): v for v in SC_CATS.values()}  # "impaction" → "impaction"

_SC_FIELD_RE   = re.compile(r"\|sc([123])\s*=\s*([^\|\n<{]+)", re.IGNORECASE)
_TYPE_FIELD_RE = re.compile(r"\|type\s*=\s*([^\|\n<{]+)", re.IGNORECASE)
_JOB_RE        = re.compile(r"\[\[([A-Z]{2,3})\]\]")
_JOB_LEVEL_BLOCK_RE = re.compile(
    r"\{\{WS Job Level(.*?)\}\}", re.DOTALL | re.IGNORECASE
)

# Maps |type= field values → display name (case-insensitive keys)
_TYPE_FIELD_MAP = {v.lower(): v for v in WEAPON_CATS.values()}


def parse_ws(page: dict) -> dict | None:
    cats = page.get("categories", [])
    text = page.get("wikitext", "")

    if "Category:Trust Weapon Skills" in cats or "Category:Trust Weapon Skills" in text:
        return None

    is_ws_page = (
        "Category:Weapon Skills" in cats
        or "{{Standard WS" in text
        or "{{Merit WS" in text
    )
    if not is_ws_page:
        return None

    # Weapon type: try categories first, fall back to |type= field
    weapon = next((WEAPON_CATS[c] for c in cats if c in WEAPON_CATS), None)
    if not weapon:
        m = _TYPE_FIELD_RE.search(text)
        if m:
            weapon = _TYPE_FIELD_MAP.get(m.group(1).strip().lower())
    if not weapon:
        return None

    # SC properties: prefer template field order (sc1 → sc2 → sc3)
    sc_from_template: list[tuple[int, str]] = []
    for m in _SC_FIELD_RE.finditer(text):
        priority = int(m.group(1))
        raw      = m.group(2).strip().lower()
        if raw in SC_NAME_MAP:
            sc_from_template.append((priority, SC_NAME_MAP[raw]))

    if sc_from_template:
        sc_props = [p for _, p in sorted(sc_from_template)]
    else:
        # Fall back to category order
        sc_props = [SC_CATS[c] for c in cats if c in SC_CATS]

    # Jobs: extract from every WS Job Level block
    job_set: set[str] = set()
    for block_m in _JOB_LEVEL_BLOCK_RE.finditer(text):
        block = block_m.group(1)
        for jm in _JOB_RE.finditer(block):
            code = jm.group(1)
            if code in JOBS:
                job_set.add(code)

    jobs_str = "/".join(sorted(job_set)) if job_set else ""

    if not sc_props:
        return None

    return {
        "n": page["title"],
        "w": weapon,
        "j": jobs_str,
        "p": sc_props,
    }


# ── Fallback list (original index.html data) ─────────────────────────────────
# Used for WS whose pages haven't been scraped yet. Wiki data takes priority.
_FALLBACK: list[dict] = [
    # Hand-to-Hand
    {"n":"Combo",            "w":"Hand-to-Hand","j":"MNK/PUP",      "p":["impaction"]},
    {"n":"Shoulder Tackle",  "w":"Hand-to-Hand","j":"MNK",          "p":["reverberation"]},
    {"n":"One Inch Punch",   "w":"Hand-to-Hand","j":"MNK",          "p":["compression"]},
    {"n":"Backhand Blow",    "w":"Hand-to-Hand","j":"MNK",          "p":["distortion","reverberation"]},
    {"n":"Raging Fists",     "w":"Hand-to-Hand","j":"MNK",          "p":["impaction"]},
    {"n":"Spinning Attack",  "w":"Hand-to-Hand","j":"MNK",          "p":["liquefaction","impaction"]},
    {"n":"Howling Fist",     "w":"Hand-to-Hand","j":"MNK",          "p":["impaction","transfixion"]},
    {"n":"Dragon's Breath",  "w":"Hand-to-Hand","j":"MNK",          "p":["liquefaction","transfixion"]},
    {"n":"Asuran Fists",     "w":"Hand-to-Hand","j":"MNK/PUP",      "p":["gravitation","distortion"]},
    {"n":"Tornado Kick",     "w":"Hand-to-Hand","j":"MNK",          "p":["detonation","impaction"]},
    {"n":"Shijin Spiral",    "w":"Hand-to-Hand","j":"MNK",          "p":["fusion","reverberation"]},
    {"n":"Final Heaven",     "w":"Hand-to-Hand","j":"MNK",          "p":["light"]},
    {"n":"Victory Smite",    "w":"Hand-to-Hand","j":"MNK",          "p":["light","transfixion"]},
    {"n":"Ascetic's Fury",   "w":"Hand-to-Hand","j":"MNK",          "p":["scission","reverberation"]},
    # Dagger
    {"n":"Wasp Sting",       "w":"Dagger",       "j":"THF/DNC",      "p":["scission"]},
    {"n":"Gust Slash",       "w":"Dagger",       "j":"THF/DNC",      "p":["detonation"]},
    {"n":"Shadowstitch",     "w":"Dagger",       "j":"THF",          "p":["reverberation"]},
    {"n":"Viper Bite",       "w":"Dagger",       "j":"THF/DNC",      "p":["scission"]},
    {"n":"Cyclone",          "w":"Dagger",       "j":"THF/BRD/DNC",  "p":["detonation","distortion"]},
    {"n":"Dancing Edge",     "w":"Dagger",       "j":"THF/DNC",      "p":["scission","detonation"]},
    {"n":"Shark Bite",       "w":"Dagger",       "j":"THF",          "p":["gravitation","scission"]},
    {"n":"Evisceration",     "w":"Dagger",       "j":"THF",          "p":["gravitation","transfixion"]},
    {"n":"Aeolian Edge",     "w":"Dagger",       "j":"THF",          "p":["scission","detonation","impaction"]},
    {"n":"Exenterator",      "w":"Dagger",       "j":"THF",          "p":["scission","reverberation"]},
    {"n":"Rudra's Storm",    "w":"Dagger",       "j":"THF",          "p":["darkness","scission"]},
    {"n":"Mordant Rime",     "w":"Dagger",       "j":"THF",          "p":["distortion","reverberation"]},
    {"n":"Pyric Kleos",      "w":"Dagger",       "j":"THF",          "p":["fusion","scission"]},
    # Sword
    {"n":"Fast Blade",       "w":"Sword",        "j":"WAR/PLD/RDM",  "p":["scission"]},
    {"n":"Burning Blade",    "w":"Sword",        "j":"WAR/PLD/RDM",  "p":["liquefaction"]},
    {"n":"Flat Blade",       "w":"Sword",        "j":"WAR/PLD/RDM",  "p":["impaction"]},
    {"n":"Shining Blade",    "w":"Sword",        "j":"PLD/RDM",      "p":["scission"]},
    {"n":"Seraph Blade",     "w":"Sword",        "j":"PLD/RDM",      "p":["scission","transfixion"]},
    {"n":"Circle Blade",     "w":"Sword",        "j":"PLD",          "p":["reverberation","induration"]},
    {"n":"Vorpal Blade",     "w":"Sword",        "j":"RDM/PLD",      "p":["scission","transfixion"]},
    {"n":"Swift Blade",      "w":"Sword",        "j":"WAR/PLD/RDM",  "p":["gravitation"]},
    {"n":"Savage Blade",     "w":"Sword",        "j":"WAR/PLD/RDM",  "p":["fragmentation","scission"]},
    {"n":"Requiescat",       "w":"Sword",        "j":"PLD/RDM",      "p":["gravitation","scission"]},
    {"n":"Death Blossom",    "w":"Sword",        "j":"RDM",          "p":["reverberation","transfixion"]},
    {"n":"Chant du Cygne",   "w":"Sword",        "j":"BRD",          "p":["light","scission"]},
    {"n":"Knights of Round", "w":"Sword",        "j":"PLD",          "p":["light","scission"]},
    # Great Sword
    {"n":"Hard Slash",       "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["scission"]},
    {"n":"Power Slash",      "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["transfixion"]},
    {"n":"Frostbite",        "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["induration"]},
    {"n":"Freezebite",       "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["induration","distortion"]},
    {"n":"Shockwave",        "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["reverberation"]},
    {"n":"Sickle Moon",      "w":"Great Sword",  "j":"WAR/DRK",      "p":["scission"]},
    {"n":"Spinning Slash",   "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["gravitation","transfixion"]},
    {"n":"Ground Strike",    "w":"Great Sword",  "j":"WAR/DRK/PLD",  "p":["gravitation","distortion"]},
    {"n":"Resolution",       "w":"Great Sword",  "j":"WAR",          "p":["light","fragmentation"]},
    {"n":"Insurgency",       "w":"Great Sword",  "j":"DRK",          "p":["darkness","fragmentation"]},
    # Axe
    {"n":"Raging Axe",       "w":"Axe",          "j":"WAR/BST/DRK",  "p":["fragmentation","scission"]},
    {"n":"Smash Axe",        "w":"Axe",          "j":"WAR/BST/DRK",  "p":["distortion","reverberation"]},
    {"n":"Gale Axe",         "w":"Axe",          "j":"WAR/BST",      "p":["detonation"]},
    {"n":"Avalanche Axe",    "w":"Axe",          "j":"WAR/BST",      "p":["distortion","reverberation"]},
    {"n":"Spinning Axe",     "w":"Axe",          "j":"WAR/BST",      "p":["reverberation","detonation"]},
    {"n":"Rampage",          "w":"Axe",          "j":"WAR",          "p":["scission","detonation"]},
    {"n":"Calamity",         "w":"Axe",          "j":"WAR",          "p":["gravitation","distortion"]},
    {"n":"Ruinator",         "w":"Axe",          "j":"WAR/BST",      "p":["darkness","gravitation"]},
    {"n":"Decimation",       "w":"Axe",          "j":"WAR",          "p":["fragmentation","reverberation"]},
    # Great Axe
    {"n":"Iron Tempest",     "w":"Great Axe",    "j":"WAR",          "p":["fragmentation","detonation"]},
    {"n":"Sturmwind",        "w":"Great Axe",    "j":"WAR",          "p":["reverberation","scission"]},
    {"n":"Ukko's Fury",      "w":"Great Axe",    "j":"WAR",          "p":["light","reverberation"]},
    {"n":"Steel Cyclone",    "w":"Great Axe",    "j":"WAR",          "p":["fragmentation","reverberation"]},
    {"n":"King's Justice",   "w":"Great Axe",    "j":"WAR",          "p":["fragmentation","reverberation"]},
    {"n":"Fell Cleave",      "w":"Great Axe",    "j":"WAR",          "p":["fragmentation","scission"]},
    {"n":"Cloudsplitter",    "w":"Great Axe",    "j":"WAR",          "p":["darkness","scission"]},
    # Scythe
    {"n":"Slice",            "w":"Scythe",       "j":"DRK",          "p":["scission"]},
    {"n":"Shadow of Death",  "w":"Scythe",       "j":"DRK",          "p":["compression","reverberation"]},
    {"n":"Nightmare Scythe", "w":"Scythe",       "j":"DRK",          "p":["fragmentation","induration"]},
    {"n":"Spinning Scythe",  "w":"Scythe",       "j":"DRK",          "p":["reverberation","induration"]},
    {"n":"Vorpal Scythe",    "w":"Scythe",       "j":"DRK",          "p":["gravitation","distortion"]},
    {"n":"Guillotine",       "w":"Scythe",       "j":"DRK",          "p":["fragmentation","distortion"]},
    {"n":"Cross Reaper",     "w":"Scythe",       "j":"DRK",          "p":["darkness"]},
    {"n":"Spiral Hell",      "w":"Scythe",       "j":"DRK",          "p":["gravitation","darkness"]},
    {"n":"Catastrophe",      "w":"Scythe",       "j":"DRK",          "p":["darkness","gravitation"]},
    {"n":"Entropy",          "w":"Scythe",       "j":"DRK",          "p":["darkness","scission"]},
    # Polearm
    {"n":"Double Thrust",    "w":"Polearm",      "j":"DRG",          "p":["transfixion"]},
    {"n":"Thunder Thrust",   "w":"Polearm",      "j":"DRG",          "p":["impaction","transfixion"]},
    {"n":"Leg Sweep",        "w":"Polearm",      "j":"DRG",          "p":["fragmentation","impaction"]},
    {"n":"Penta Thrust",     "w":"Polearm",      "j":"DRG",          "p":["compression"]},
    {"n":"Skewer",           "w":"Polearm",      "j":"DRG",          "p":["transfixion","impaction"]},
    {"n":"Vorpal Thrust",    "w":"Polearm",      "j":"DRG",          "p":["transfixion","impaction"]},
    {"n":"Wheeling Thrust",  "w":"Polearm",      "j":"DRG",          "p":["fusion","detonation"]},
    {"n":"Impulse Drive",    "w":"Polearm",      "j":"DRG",          "p":["gravitation","transfixion"]},
    {"n":"Drakesbane",       "w":"Polearm",      "j":"DRG",          "p":["light","fragmentation"]},
    {"n":"Stardiver",        "w":"Polearm",      "j":"DRG",          "p":["light","transfixion"]},
    # Katana
    {"n":"Blade: Rin",       "w":"Katana",       "j":"NIN",          "p":["transfixion"]},
    {"n":"Blade: Retsu",     "w":"Katana",       "j":"NIN",          "p":["scission"]},
    {"n":"Blade: Teki",      "w":"Katana",       "j":"NIN",          "p":["reverberation"]},
    {"n":"Blade: To",        "w":"Katana",       "j":"NIN",          "p":["induration","detonation"]},
    {"n":"Blade: Chi",       "w":"Katana",       "j":"NIN",          "p":["transfixion","impaction"]},
    {"n":"Blade: Ei",        "w":"Katana",       "j":"NIN",          "p":["compression"]},
    {"n":"Blade: Jin",       "w":"Katana",       "j":"NIN",          "p":["impaction","detonation"]},
    {"n":"Blade: Ten",       "w":"Katana",       "j":"NIN",          "p":["gravitation"]},
    {"n":"Blade: Ku",        "w":"Katana",       "j":"NIN",          "p":["gravitation","transfixion"]},
    {"n":"Blade: Yu",        "w":"Katana",       "j":"NIN",          "p":["scission","reverberation"]},
    {"n":"Blade: Shun",      "w":"Katana",       "j":"NIN",          "p":["distortion","scission"]},
    {"n":"Blade: Hi",        "w":"Katana",       "j":"NIN",          "p":["light","scission"]},
    # Great Katana
    {"n":"Tachi: Enpi",      "w":"Great Katana", "j":"SAM",          "p":["transfixion","scission"]},
    {"n":"Tachi: Hobaku",    "w":"Great Katana", "j":"SAM",          "p":["induration"]},
    {"n":"Tachi: Goten",     "w":"Great Katana", "j":"SAM",          "p":["impaction","transfixion"]},
    {"n":"Tachi: Kagero",    "w":"Great Katana", "j":"SAM",          "p":["liquefaction"]},
    {"n":"Tachi: Jinpu",     "w":"Great Katana", "j":"SAM",          "p":["scission","detonation"]},
    {"n":"Tachi: Koki",      "w":"Great Katana", "j":"SAM",          "p":["reverberation","transfixion"]},
    {"n":"Tachi: Yukikaze",  "w":"Great Katana", "j":"SAM",          "p":["induration","distortion"]},
    {"n":"Tachi: Gekko",     "w":"Great Katana", "j":"SAM",          "p":["distortion","reverberation"]},
    {"n":"Tachi: Kasha",     "w":"Great Katana", "j":"SAM",          "p":["fusion","compression"]},
    {"n":"Tachi: Ageha",     "w":"Great Katana", "j":"SAM",          "p":["gravitation","scission"]},
    {"n":"Tachi: Shoha",     "w":"Great Katana", "j":"SAM",          "p":["light","gravitation"]},
    {"n":"Tachi: Fudo",      "w":"Great Katana", "j":"SAM",          "p":["light","gravitation"]},
    {"n":"Tachi: Rana",      "w":"Great Katana", "j":"SAM",          "p":["fragmentation","reverberation"]},
    # Club
    {"n":"Shining Strike",   "w":"Club",         "j":"WHM/SCH",      "p":["transfixion"]},
    {"n":"Seraph Strike",    "w":"Club",         "j":"WHM/SCH",      "p":["transfixion"]},
    {"n":"Brainshaker",      "w":"Club",         "j":"WHM/SCH",      "p":["reverberation"]},
    {"n":"Skullbreaker",     "w":"Club",         "j":"WHM/SCH",      "p":["fragmentation","reverberation"]},
    {"n":"True Strike",      "w":"Club",         "j":"WHM",          "p":["impaction","distortion"]},
    {"n":"Hexa Strike",      "w":"Club",         "j":"WHM/SCH",      "p":["light","transfixion"]},
    {"n":"Black Halo",       "w":"Club",         "j":"WHM/SCH",      "p":["gravitation","compression"]},
    {"n":"Judgment",         "w":"Club",         "j":"WHM/SCH",      "p":["transfixion","light"]},
    {"n":"Realmrazer",       "w":"Club",         "j":"WHM",          "p":["light","scission"]},
    {"n":"Expiacion",        "w":"Club",         "j":"WHM",          "p":["scission","compression"]},
    {"n":"Dagan",            "w":"Club",         "j":"WHM",          "p":["fusion","gravitation"]},
    # Staff
    {"n":"Heavy Swing",      "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["impaction"]},
    {"n":"Rock Crusher",     "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["reverberation","compression"]},
    {"n":"Earth Crusher",    "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["impaction","detonation"]},
    {"n":"Starburst",        "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["transfixion","reverberation"]},
    {"n":"Sunburst",         "w":"Staff",        "j":"WHM/SMN",      "p":["transfixion","liquefaction"]},
    {"n":"Full Swing",       "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["liquefaction","impaction"]},
    {"n":"Retribution",      "w":"Staff",        "j":"BLM/WHM/SMN",  "p":["gravitation","reverberation"]},
    {"n":"Cataclysm",        "w":"Staff",        "j":"BLM",          "p":["darkness","distortion"]},
    {"n":"Gate of Tartarus", "w":"Staff",        "j":"BLM",          "p":["darkness","gravitation"]},
    # Archery
    {"n":"Flaming Arrow",    "w":"Archery",      "j":"RNG",          "p":["liquefaction","transfixion"]},
    {"n":"Piercing Arrow",   "w":"Archery",      "j":"RNG",          "p":["transfixion","reverberation"]},
    {"n":"Dulling Arrow",    "w":"Archery",      "j":"RNG",          "p":["transfixion"]},
    {"n":"Sidewinder",       "w":"Archery",      "j":"RNG",          "p":["reverberation","detonation"]},
    {"n":"Arching Arrow",    "w":"Archery",      "j":"RNG",          "p":["fragmentation","reverberation"]},
    {"n":"Empyreal Arrow",   "w":"Archery",      "j":"RNG",          "p":["fusion","transfixion"]},
    {"n":"Refulgent Arrow",  "w":"Archery",      "j":"RNG",          "p":["light","transfixion"]},
    # Marksmanship
    {"n":"Hot Shot",         "w":"Marksmanship", "j":"RNG/COR",      "p":["liquefaction","transfixion"]},
    {"n":"Split Shot",       "w":"Marksmanship", "j":"RNG/COR",      "p":["transfixion","reverberation"]},
    {"n":"Slug Shot",        "w":"Marksmanship", "j":"RNG/COR",      "p":["detonation","reverberation"]},
    {"n":"Heavy Shot",       "w":"Marksmanship", "j":"RNG",          "p":["fusion","transfixion"]},
    {"n":"Detonator",        "w":"Marksmanship", "j":"RNG",          "p":["fragmentation","transfixion"]},
    {"n":"Last Stand",       "w":"Marksmanship", "j":"COR",          "p":["fragmentation","reverberation"]},
    {"n":"Coronach",         "w":"Marksmanship", "j":"COR",          "p":["darkness","reverberation"]},
    {"n":"Wildfire",         "w":"Marksmanship", "j":"COR",          "p":["fusion","light"]},
    {"n":"Leaden Salute",    "w":"Marksmanship", "j":"COR",          "p":["darkness","reverberation"]},
]


def main() -> None:
    results: list[dict] = []
    skipped = 0

    for jf in sorted(PAGES_DIR.rglob("*.json")):
        with open(jf, encoding="utf-8") as f:
            page = json.load(f)
        ws = parse_ws(page)
        if ws:
            results.append(ws)
        elif "Category:Weapon Skills" in page.get("categories", []):
            skipped += 1
            print(f"  skip (no weapon type): {page['title']}", file=sys.stderr)

    # Merge: wiki data takes priority; fallback fills any gaps (skip no-property entries)
    wiki_names = {ws["n"] for ws in results}
    for fb in _FALLBACK:
        if fb["n"] not in wiki_names and fb["p"]:
            results.append(fb)

    # Sort: weapon type first, then name
    results.sort(key=lambda x: (x["w"], x["n"]))

    lines = ["WS = ["]
    for ws in results:
        p_repr = repr(ws["p"])
        lines.append(
            f'    {{"n": {ws["n"]!r:35s}, "w": {ws["w"]!r:17s}, '
            f'"j": {ws["j"]!r:25s}, "p": {p_repr}}},'
        )
    lines.append("]")

    OUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(results)} weapon skills to {OUT_FILE}  ({skipped} skipped)")


if __name__ == "__main__":
    main()
