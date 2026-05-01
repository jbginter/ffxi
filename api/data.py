import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.data.props import PROPS
from backend.data.combos import COMBOS
from backend.data.magic_burst import MB
from backend.data.weapon_skills import WS

_PAYLOAD = json.dumps({"props": PROPS, "combos": COMBOS, "mb": MB, "ws": WS}).encode()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(_PAYLOAD)

    def log_message(self, *args):
        pass
