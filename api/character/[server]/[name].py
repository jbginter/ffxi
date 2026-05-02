import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.ffxiah import lookup


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Vercel injects [server] and [name] as query-string params
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        server = qs.get("server", [""])[0]
        name = qs.get("name", [""])[0]

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
