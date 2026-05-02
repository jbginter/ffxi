from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .data.props import PROPS
from .data.combos import COMBOS
from .data.magic_burst import MB
from .data.weapon_skills import WS
from .ffxiah import lookup, servers

app = FastAPI(title="FFXI Skillchain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)


@app.get("/api/data")
def get_all_data():
    return {"props": PROPS, "combos": COMBOS, "mb": MB, "ws": WS}


@app.get("/api/servers")
def get_servers():
    return servers()


@app.get("/api/character/{server}/{name}")
def get_character(server: str, name: str):
    result = lookup(server, name)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
