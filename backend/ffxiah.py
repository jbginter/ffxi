import json
import re
import urllib.error
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (compatible; FFXI-SC-Tool/1.0)"
TIMEOUT = 10

_SERVERS: dict[str, int] = {
    "Asura": 28, "Bahamut": 1, "Bismarck": 6, "Carbuncle": 8, "Cerberus": 9,
    "Fenrir": 11, "Lakshmi": 14, "Leviathan": 15, "Odin": 20, "Phoenix": 22,
    "Quetzalcoatl": 23, "Ragnarok": 24, "Shiva": 25, "Siren": 27,
    "Sylph": 29, "Valefor": 30,
}
_SERVER_LIST: list[str] = sorted(_SERVERS)

def servers() -> list[str]:
    return _SERVER_LIST


def _get_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode("utf-8", errors="replace")


def _extract_js_var(html: str, var: str) -> str | None:
    m = re.search(rf"(?:var\s+)?{re.escape(var)}\s*=\s*(.+?);", html, re.DOTALL)
    return m.group(1).strip() if m else None


def lookup(server: str, name: str) -> dict:
    if server not in _SERVERS:
        return {"error": f"Unknown server: {server}"}
    if not name or len(name) > 15:
        return {"error": "Invalid character name"}
    url = f"https://www.ffxiah.com/player/{urllib.parse.quote(server)}/{urllib.parse.quote(name)}"
    try:
        html = _get_html(url)
    except urllib.error.HTTPError as e:
        return {"error": f"Character not found ({e.code})"}
    except Exception as e:
        return {"error": str(e)}

    # Player.id is the authoritative indicator of a valid character page
    if not re.search(r"Player\.id\s*=\s*\d+", html):
        return {"error": "Character not found on this server"}

    result: dict = {"name": name, "server": server, "url": url}

    raw_id = _extract_js_var(html, "Player.id")
    if raw_id:
        try:
            result["id"] = int(raw_id)
        except ValueError:
            pass

    raw_sales = _extract_js_var(html, "Player.sales")
    if raw_sales:
        try:
            sales = json.loads(raw_sales)
            result["sales"] = sales[:20]  # cap at 20
        except (json.JSONDecodeError, TypeError):
            result["sales"] = []
    else:
        result["sales"] = []

    return result
