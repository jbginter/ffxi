"""Tests for the FastAPI application endpoints."""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


class TestHealth:
    def test_returns_200(self):
        assert client.get("/health").status_code == 200

    def test_returns_ok_status(self):
        assert client.get("/health").json() == {"status": "ok"}


class TestApiData:
    def test_returns_200(self):
        assert client.get("/api/data").status_code == 200

    def test_response_has_required_keys(self):
        body = client.get("/api/data").json()
        assert {"props", "combos", "mb", "ws"}.issubset(body.keys())

    def test_props_is_dict(self):
        assert isinstance(client.get("/api/data").json()["props"], dict)

    def test_combos_is_dict(self):
        assert isinstance(client.get("/api/data").json()["combos"], dict)

    def test_ws_is_list(self):
        assert isinstance(client.get("/api/data").json()["ws"], list)

    def test_ws_is_nonempty(self):
        assert len(client.get("/api/data").json()["ws"]) > 0


class TestApiServers:
    def test_returns_200(self):
        assert client.get("/api/servers").status_code == 200

    def test_returns_a_list(self):
        assert isinstance(client.get("/api/servers").json(), list)

    def test_list_is_nonempty(self):
        assert len(client.get("/api/servers").json()) > 0

    def test_asura_is_present(self):
        assert "Asura" in client.get("/api/servers").json()


class TestApiCharacter:
    def test_invalid_server_returns_404(self):
        assert client.get("/api/character/Zanarkand/Cloud").status_code == 404

    def test_invalid_server_returns_detail(self):
        body = client.get("/api/character/Zanarkand/Cloud").json()
        assert "detail" in body

    def test_name_too_long_returns_404(self):
        assert client.get(f"/api/character/Asura/{'A' * 16}").status_code == 404

    @patch("backend.main.lookup")
    def test_successful_lookup_returns_200(self, mock_lookup):
        mock_lookup.return_value = {"name": "Shantotto", "server": "Asura", "url": "http://x", "sales": []}
        assert client.get("/api/character/Asura/Shantotto").status_code == 200

    @patch("backend.main.lookup")
    def test_successful_lookup_returns_character_data(self, mock_lookup):
        mock_lookup.return_value = {"name": "Shantotto", "server": "Asura", "url": "http://x", "sales": []}
        body = client.get("/api/character/Asura/Shantotto").json()
        assert body["name"] == "Shantotto"
        assert body["server"] == "Asura"
