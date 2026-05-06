"""Validates that the static game data is internally self-consistent."""
import pytest

from backend.data.props import PROPS
from backend.data.combos import COMBOS
from backend.data.magic_burst import MB
from backend.data.weapon_skills import WS

REQUIRED_PROP_FIELDS = {"id", "name", "level", "elements", "color"}
VALID_LEVELS = {1, 2, 3, 4}
EXPECTED_ELEMENTS = {"Fire", "Ice", "Wind", "Earth", "Thunder", "Water", "Light", "Dark"}


class TestProps:
    def test_all_have_required_fields(self):
        for key, prop in PROPS.items():
            missing = REQUIRED_PROP_FIELDS - prop.keys()
            assert not missing, f"PROPS['{key}'] missing fields: {missing}"

    def test_id_matches_key(self):
        for key, prop in PROPS.items():
            assert prop["id"] == key, f"PROPS['{key}']['id'] = '{prop['id']}'"

    def test_level_is_valid(self):
        for key, prop in PROPS.items():
            assert prop["level"] in VALID_LEVELS, f"PROPS['{key}'] has invalid level {prop['level']}"

    def test_elements_is_nonempty_list(self):
        for key, prop in PROPS.items():
            assert isinstance(prop["elements"], list) and prop["elements"], \
                f"PROPS['{key}']['elements'] must be a non-empty list"


class TestCombos:
    def test_keys_reference_valid_props(self):
        for combo_key in COMBOS:
            op, cp = combo_key.split(":")
            assert op in PROPS, f"Combo '{combo_key}': opener '{op}' not in PROPS"
            assert cp in PROPS, f"Combo '{combo_key}': closer '{cp}' not in PROPS"

    def test_values_reference_valid_props(self):
        for combo_key, result in COMBOS.items():
            assert result in PROPS, f"Combo '{combo_key}' → '{result}' not in PROPS"

    def test_result_level_exceeds_or_matches_inputs(self):
        """The result of a combo should be at least as high-level as the openers."""
        for combo_key, result in COMBOS.items():
            op, cp = combo_key.split(":")
            max_input_level = max(PROPS[op]["level"], PROPS[cp]["level"])
            assert PROPS[result]["level"] >= max_input_level, \
                f"Combo '{combo_key}' → '{result}' (Lv{PROPS[result]['level']}) regresses from input Lv{max_input_level}"

    def test_all_level1_self_chains_exist(self):
        level1 = [k for k, v in PROPS.items() if v["level"] == 1]
        for prop in level1:
            assert f"{prop}:{prop}" in COMBOS, f"Missing self-chain for '{prop}'"


class TestMagicBurst:
    def test_covers_all_eight_elements(self):
        assert set(MB.keys()) == EXPECTED_ELEMENTS

    def test_all_prop_references_are_valid(self):
        for element, prop_ids in MB.items():
            for pid in prop_ids:
                assert pid in PROPS, f"MB['{element}'] references unknown prop '{pid}'"

    def test_each_element_has_at_least_one_entry(self):
        for element, prop_ids in MB.items():
            assert prop_ids, f"MB['{element}'] is empty"


class TestWeaponSkills:
    def test_all_have_required_fields(self):
        for ws in WS:
            for field in ("n", "w", "j", "p"):
                assert field in ws, f"WS '{ws.get('n', '?')}' missing field '{field}'"

    def test_props_reference_valid_prop_ids(self):
        for ws in WS:
            for pid in ws["p"]:
                assert pid in PROPS, f"WS '{ws['n']}' references unknown prop '{pid}'"

    def test_names_are_unique(self):
        names = [ws["n"] for ws in WS]
        dupes = {n for n in names if names.count(n) > 1}
        assert not dupes, f"Duplicate weapon skill names: {dupes}"

    def test_props_list_has_no_duplicates(self):
        for ws in WS:
            assert len(ws["p"]) == len(set(ws["p"])), \
                f"WS '{ws['n']}' has duplicate props: {ws['p']}"
