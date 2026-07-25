import urllib.request, re, json, time

URLS = {
    "emanuele-ribero": "https://www.transfermarkt.it/emanuele-ribero/profil/spieler/1056751",
    "gabriel-furghieri": "https://www.transfermarkt.it/gabriel-furghieri/profil/spieler/1058885",
    "giacomo-risaliti": "https://www.transfermarkt.it/giacomo-risaliti/profil/spieler/207965",
    "lorenzo-polvani": "https://www.transfermarkt.it/lorenzo-polvani/profil/spieler/331838",
    "erik-panizzi": "https://www.transfermarkt.it/erik-panizzi/profil/spieler/211416",
    "luca-zanon": "https://www.transfermarkt.it/luca-zanon/profil/spieler/280044",
    "lorenzo-pucci": "https://www.transfermarkt.it/lorenzo-pucci/profil/spieler/1089757",
    "karim-zakaria": "https://www.transfermarkt.it/karim-zakaria/profil/spieler/1345725",
    "isaia-lattarulo": "https://www.transfermarkt.it/isaia-lattarulo/profil/spieler/394777",
    "mattia-fiorini": "https://www.transfermarkt.it/mattia-fiorini/profil/spieler/459704",
    "emanuele-spinozzi": "https://www.transfermarkt.it/emanuele-spinozzi/profil/spieler/340447",
    "francesco-dorsi": "https://www.transfermarkt.it/francesco-dorsi/profil/spieler/342350",
    "riccardo-biguzzi": "https://www.transfermarkt.it/riccardo-biguzzi/profil/spieler/1296430",
    "edoardo-marzierli": "https://www.transfermarkt.it/edoardo-marzierli/profil/spieler/599009",
    "francesco-verde": "https://www.transfermarkt.it/francesco-verde/profil/spieler/395870",
    "giacomo-benedetti": "https://www.transfermarkt.it/giacomo-benedetti/profil/spieler/458165",
    "simone-greselin": "https://www.transfermarkt.it/simone-greselin/profil/spieler/373436",
    "luca-sermenghi": "https://www.transfermarkt.it/luca-sermenghi/profil/spieler/1317388",
    "francesco-barranca": "https://www.transfermarkt.it/francesco-barranca/profil/spieler/568709",
    "giammarco-caon": "https://www.transfermarkt.it/giammarco-caon/profil/spieler/537455",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

results = {}
for key, url in URLS.items():
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15)
        html = resp.read().decode("utf-8", "replace")
    except Exception as e:
        results[key] = f"ERROR: {e}"
        print(f"{key}: ERROR {e}")
        continue

    pos = None
    # Try multiple patterns
    patterns = [
        r"hauptpositionContent[\"']?\s*>([^<]+)",
        r'"position":\s*"([^"]+)"',
        r"Position\s*:?\s*</span>\s*<span[^>]*>([^<]+)",
        r"Posizione\s*:?\s*</span>\s*<span[^>]*>([^<]+)",
    ]
    for pat in patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            pos = m.group(1).strip()
            break

    results[key] = pos
    print(f"{key}: {pos}")
    time.sleep(0.5)

with open("player-positions.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\nDone!")