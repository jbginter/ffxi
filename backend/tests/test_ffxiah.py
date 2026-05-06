"""Tests for ffxiah.py — server list and character lookup logic."""
from unittest.mock import patch
import urllib.error

import pytest

from backend.ffxiah import servers, lookup, _extract_js_var


class TestServers:
    def test_returns_a_list(self):
        assert isinstance(servers(), list)

    def test_list_is_sorted(self):
        result = servers()
        assert result == sorted(result)

    def test_contains_known_servers(self):
        result = servers()
        for name in ("Asura", "Bahamut", "Odin", "Phoenix"):
            assert name in result

    def test_returns_same_object_on_repeated_calls(self):
        assert servers() is servers()


class TestExtractJsVar:
    def test_finds_integer_value(self):
        assert _extract_js_var("Player.id = 12345;", "Player.id") == "12345"

    def test_finds_string_value(self):
        assert _extract_js_var('Player.name = "Shantotto";', "Player.name") == '"Shantotto"'

    def test_finds_var_keyword_form(self):
        assert _extract_js_var("var foo = 99;", "foo") == "99"

    def test_returns_none_when_not_found(self):
        assert _extract_js_var("<html>nothing here</html>", "Player.id") is None

    def test_strips_whitespace_from_value(self):
        assert _extract_js_var("Player.id =   42  ;", "Player.id") == "42"


class TestLookup:
    def test_unknown_server_returns_error(self):
        result = lookup("Zanarkand", "Cloud")
        assert "error" in result
        assert "Unknown server" in result["error"]

    def test_empty_name_returns_error(self):
        result = lookup("Asura", "")
        assert "error" in result

    def test_name_too_long_returns_error(self):
        result = lookup("Asura", "A" * 16)
        assert "error" in result

    @patch("backend.ffxiah._get_html")
    def test_page_without_player_id_returns_error(self, mock_get):
        mock_get.return_value = "<html>some page without player data</html>"
        result = lookup("Asura", "Testchar")
        assert "error" in result
        assert "not found" in result["error"].lower()

    @patch("backend.ffxiah._get_html")
    def test_valid_page_returns_name_server_url(self, mock_get):
        mock_get.return_value = "Player.id = 9999; Player.sales = [];"
        result = lookup("Asura", "Testchar")
        assert result["name"] == "Testchar"
        assert result["server"] == "Asura"
        assert "ffxiah.com" in result["url"]

    @patch("backend.ffxiah._get_html")
    def test_valid_page_includes_sales(self, mock_get):
        mock_get.return_value = 'Player.id = 1; Player.sales = [{"price": 100}];'
        result = lookup("Asura", "Testchar")
        assert "sales" in result
        assert isinstance(result["sales"], list)

    @patch("backend.ffxiah._get_html")
    def test_sales_capped_at_20(self, mock_get):
        sales_json = "[" + ",".join(['{"price":1}'] * 30) + "]"
        mock_get.return_value = f"Player.id = 1; Player.sales = {sales_json};"
        result = lookup("Asura", "Testchar")
        assert len(result["sales"]) == 20

    @patch("backend.ffxiah._get_html")
    def test_http_404_returns_error(self, mock_get):
        mock_get.side_effect = urllib.error.HTTPError(
            url=None, code=404, msg="Not Found", hdrs=None, fp=None,
        )
        result = lookup("Asura", "Testchar")
        assert "error" in result
        assert "404" in result["error"]

    @patch("backend.ffxiah._get_html")
    def test_network_error_returns_error(self, mock_get):
        mock_get.side_effect = OSError("connection refused")
        result = lookup("Asura", "Testchar")
        assert "error" in result
