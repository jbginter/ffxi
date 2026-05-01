from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data.props import PROPS
from .data.combos import COMBOS
from .data.magic_burst import MB
from .data.weapon_skills import WS

app = FastAPI(title="FFXI Skillchain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_all_data():
    return {"props": PROPS, "combos": COMBOS, "mb": MB, "ws": WS}


@app.get("/api/props")
def get_props():
    return PROPS


@app.get("/api/combos")
def get_combos():
    return COMBOS


@app.get("/api/mb")
def get_magic_burst():
    return MB


@app.get("/api/ws")
def get_weapon_skills():
    return WS
