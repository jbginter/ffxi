COMBOS = {
    # L1 self-chains
    "liquefaction:liquefaction":   "liquefaction",
    "scission:scission":           "scission",
    "reverberation:reverberation": "reverberation",
    "detonation:detonation":       "detonation",
    "induration:induration":       "induration",
    "impaction:impaction":         "impaction",
    "transfixion:transfixion":     "transfixion",
    "compression:compression":     "compression",
    # L1 → L2
    "liquefaction:impaction":      "fusion",
    "induration:reverberation":    "distortion",
    "transfixion:scission":        "distortion",
    "compression:scission":        "gravitation",
    "detonation:impaction":        "fragmentation",
    "reverberation:scission":      "fragmentation",
    # L2 → L3
    "gravitation:gravitation":     "darkness",
    "gravitation:distortion":      "darkness",
    "distortion:fusion":           "light",
    "fragmentation:fusion":        "light",
    # L3 → L4
    "light:light":                 "light4",
    "darkness:darkness":           "darkness4",
}
