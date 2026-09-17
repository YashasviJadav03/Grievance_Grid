TRAINING_CORPUS = [
    # WATER (Department code: WATER)
    ("no water supply in my area for 3 days", "WATER", "Contaminated / No Water Supply"),
    ("drinking water is completely stopped in sector 12 since morning", "WATER", "Contaminated / No Water Supply"),
    ("tap water is yellow muddy and smelling foul, unsafe to drink", "WATER", "Contaminated / No Water Supply"),
    ("drinking water pipeline burst and clean water is gushing out on the road", "WATER", "Pipe Burst / Water Leakage"),
    ("major underground leak near water meter flooded our basement", "WATER", "Pipe Burst / Water Leakage"),
    ("pipe cracked under pavement water flowing continuously", "WATER", "Pipe Burst / Water Leakage"),
    ("extremely low water pressure, water not reaching overhead tank", "WATER", "Low Water Pressure"),
    ("trickle of water from taps since yesterday evening", "WATER", "Low Water Pressure"),
    ("water tanker did not arrive in colony today", "WATER", "Contaminated / No Water Supply"),

    # ROADS (Department code: ROADS)
    ("huge dangerous pothole near the main junction causing accidents", "ROADS", "Pothole / Road Damage"),
    ("road is broken with sharp asphalt stones and craters", "ROADS", "Pothole / Road Damage"),
    ("deep crater formed on highway near flyover exit", "ROADS", "Pothole / Road Damage"),
    ("all street lights on 4th cross road are off, pitch dark and unsafe for women", "ROADS", "Broken Streetlight / Dark Spot"),
    ("broken street lamp blinking continuously, dark stretch on ring road", "ROADS", "Broken Streetlight / Dark Spot"),
    ("traffic light at crossroad is dead, terrible gridlock and near-misses", "ROADS", "Traffic Signal Malfunction"),
    ("signal timer stuck on red for 20 minutes causing road jam", "ROADS", "Traffic Signal Malfunction"),
    ("missing road divider and damaged curb near school entrance", "ROADS", "Pothole / Road Damage"),

    # ELECTRICITY (Department code: ELECTRICITY)
    ("frequent power cuts every two hours in our residential block", "ELECTRICITY", "Frequent Power Cuts / Blackout"),
    ("total blackout in sector 7 since 2 pm today", "ELECTRICITY", "Frequent Power Cuts / Blackout"),
    ("unscheduled load shedding and power outage for 8 hours", "ELECTRICITY", "Frequent Power Cuts / Blackout"),
    ("live electric wire snapped and hanging over street near park", "ELECTRICITY", "Fallen Power Line / Wire Hazard"),
    ("sparking transformer and loose high-tension cables on pole", "ELECTRICITY", "Fallen Power Line / Wire Hazard"),
    ("electrical short circuit at substation sparking sparks falling on cars", "ELECTRICITY", "Fallen Power Line / Wire Hazard"),
    ("electricity meter burnt out with smoke coming out of meter box", "ELECTRICITY", "Faulty / Burnt Electricity Meter"),
    ("digital electric meter showing faulty reading and high voltage surge", "ELECTRICITY", "Faulty / Burnt Electricity Meter"),

    # SANITATION (Department code: SANITATION)
    ("garbage dump overflowing on roadside with flies and terrible stench", "SANITATION", "Uncollected Garbage / Overflowing Dumpster"),
    ("municipal garbage truck has not visited our street for one week", "SANITATION", "Uncollected Garbage / Overflowing Dumpster"),
    ("trash bin outside community hall overflowing with rotten organic waste", "SANITATION", "Uncollected Garbage / Overflowing Dumpster"),
    ("clogged sewer line overflowing black sewage water into front yard", "SANITATION", "Clogged Drain / Sewer Overflow"),
    ("storm water drain blocked with plastic and sewage entering street", "SANITATION", "Clogged Drain / Sewer Overflow"),
    ("manhole overflow of gutter water during light rain", "SANITATION", "Clogged Drain / Sewer Overflow"),
    ("dead stray animal lying on pavement near market, decaying", "SANITATION", "Dead Animal Disposal"),
    ("carcass of animal on pedestrian path needs immediate clearance", "SANITATION", "Dead Animal Disposal"),
]

# High-precision keywords map
KEYWORD_RULES = {
    "WATER": {
        "keywords": [
            "water", "pipe", "pipeline", "leak", "leakage", "tap", "drinking water", 
            "tanker", "tank", "pressure", "burst", "supply", "gush", "jal"
        ],
        "default_category": "Contaminated / No Water Supply",
        "category_keywords": {
            "Pipe Burst / Water Leakage": ["burst", "leak", "leakage", "gushing", "cracked", "pipe broken"],
            "Contaminated / No Water Supply": ["no water", "stopped", "smelling", "muddy", "yellow", "tanker", "brown", "dirty water", "foul"],
            "Low Water Pressure": ["low pressure", "trickle", "overhead", "not reaching", "weak pressure"]
        }
    },
    "ROADS": {
        "keywords": [
            "road", "pothole", "crater", "asphalt", "tar", "street light", "streetlight", 
            "street lamp", "traffic light", "traffic signal", "signal", "pavement", "flyover", "divider"
        ],
        "default_category": "Pothole / Road Damage",
        "category_keywords": {
            "Pothole / Road Damage": ["pothole", "crater", "broken road", "asphalt", "damage", "stones", "divider"],
            "Broken Streetlight / Dark Spot": ["street light", "streetlight", "street lamp", "lamp", "dark", "pitch dark", "blinking"],
            "Traffic Signal Malfunction": ["traffic light", "traffic signal", "signal", "junction", "red light", "timer"]
        }
    },
    "ELECTRICITY": {
        "keywords": [
            "power", "electricity", "voltage", "blackout", "cut", "cuts", "wire", 
            "transformer", "meter", "current", "load shedding", "sparking", "substation", "bijli"
        ],
        "default_category": "Frequent Power Cuts / Blackout",
        "category_keywords": {
            "Fallen Power Line / Wire Hazard": ["hanging", "wire", "live wire", "snapped", "sparking", "transformer", "cables"],
            "Frequent Power Cuts / Blackout": ["power cut", "power cuts", "blackout", "load shedding", "outage", "no power"],
            "Faulty / Burnt Electricity Meter": ["meter", "burnt", "smoke", "voltage surge", "fluctuation", "reading"]
        }
    },
    "SANITATION": {
        "keywords": [
            "garbage", "trash", "waste", "drain", "drainage", "sewage", "sewer", 
            "manhole", "dump", "dumpster", "stench", "dead animal", "carcass", "gutter", "safai"
        ],
        "default_category": "Uncollected Garbage / Overflowing Dumpster",
        "category_keywords": {
            "Uncollected Garbage / Overflowing Dumpster": ["garbage", "trash", "waste", "dump", "dumpster", "truck", "bins", "stench"],
            "Clogged Drain / Sewer Overflow": ["drain", "drainage", "sewage", "sewer", "manhole", "clogged", "gutter", "overflow"],
            "Dead Animal Disposal": ["dead animal", "carcass", "dead dog", "decaying"]
        }
    }
}
