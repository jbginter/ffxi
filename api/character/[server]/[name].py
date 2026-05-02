import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from backend.ffxiah import lookup


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Path: /api/character/{server}/{name}
        parts = self.path.split("?")[0].strip("/").split("/")
        server = parts[3] if len(parts) > 3 else ""
        name = parts[4] if len(parts) > 4 else ""

        result = lookup(server, name)

        if "error" in result:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": result["error"]}).encode())
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

    def log_message(self, *args):
        pass
