import json, re, urllib.request, time, sys

URLS = [
    ("https://www.transfermarkt.it/emanuele-ribero/profil/spieler/1056751", "emanuele-ribero"),
    ("https://www.transfermarkt.it/gabriel-furghieri/profil/spieler/1058885", "gabriel-furghieri"),
    ("https://www.transfermarkt.it/giacomo-risaliti/profil/spieler/207965", "giacomo-risaliti"),
    ("https://www.transfermarkt.it/lorenzo-polvani/profil/spieler/331838", "lorenzo-polvani"),
    ("https://www.transfermarkt.it/erik-panizzi/profil/spieler/211416", "erik-panizzi"),
    ("https://www.transfermarkt.it/luca-zanon/profil/spieler/280044", "luca-zanon"),
    ("https://www.transfermarkt.it/lorenzo-pucci/profil/spieler/1089757", "lorenzo-pucci"),
    ("https://www.transfermarkt.it/karim-zakaria/profil/spieler/1345725", "karim-zakaria"),
    ("https://www.transfermarkt.it/isaia-lattarulo/profil/spieler/394777", "isaia-lattarulo"),
    ("https://www.transfermarkt.it/mattia-fiorini/profil/spieler/459704", "mattia-fiorini"),
    ("https://www.transfermarkt.it/emanuele-spinozzi/profil/spieler/340447", "emanuele-spinozzi"),
    ("https://www.transfermarkt.it/francesco-dorsi/profil/spieler/342350", "francesco-dorsi"),
    ("https://www.transfermarkt.it/riccardo-biguzzi/profil/spieler/1296430", "riccardo-biguzzi"),
    ("https://www.transfermarkt.it/edoardo-marzierli/profil/spieler/599009", "edoardo-marzierli"),
    ("https://www.transfermarkt.it/francesco-verde/profil/spieler/395870", "francesco-verde"),
    ("https://www.transfermarkt.it/giacomo-benedetti/profil/spieler/458165", "giacomo-benedetti"),
    ("https://www.transfermarkt.it/simone-greselin/profil/spieler/373436", "simone-greselin"),
    ("https://www.transfermarkt.it/luca-sermenghi/profil/spieler/1317388", "luca-sermenghi"),
    ("https://www.transfermarkt.it/francesco-barranca/profil/spieler/568709", "francesco-barranca"),
    ("https://www.transfermarkt.it/giammarco-caon/profil/spieler/537455", "giammarco-caon"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
}

def fetch(url, key):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        html = resp.read().decode("utf-8", "replace")
    except Exception as e:
        return {"key": key, "url": url, "error": str(e)}
    
    r = {"key": key, "url": url}
    
    # Title
    m = re.search(r"<title>([^<]+)</title>", html)
    r["title"] = m.group(1).strip() if m else None
    
    # H1
    m = re.search(r'<h1[^>]*class="[^"]*data-header__headline[^"]*"[^>]*>(.*?)</h1>', html, re.DOTALL)
    if not m:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    if m:
        r["h1_name"] = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    
    # Position
    for pat in [r'hauptpositionContent["\']?\s*>([^<]+)', r"Position\s*:\s*</span>\s*<span[^>]*>([^<]+)", r'data-position["\']?\s*>([^<]+)']:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            r["position"] = m.group(1).strip()
            break
    
    # Birth date
    for pat in [r'<span[^>]*itemprop="birthDate"[^>]*>([^<]+)', r"Date of birth[^<]*</span>\s*<span[^>]*>([^<]+)", r"Nato il[^<]*</span>\s*<span[^>]*>([^<]+)"]:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            r["birth_date"] = m.group(1).strip()
            break
    
    # Birth place
    m = re.search(r'itemprop="birthPlace"[^>]*>([^<]+)', html)
    if not m:
        m = re.search(r"Luogo di nascita[^<]*</span>\s*<span[^>]*>([^<]+)", html)
    r["birth_place"] = m.group(1).strip() if m else None
    
    # Nationality
    m = re.search(r'itemprop="nationality"[^>]*>([^<]+)', html)
    if not m:
        m = re.search(r"Nazionalit[^<]*</span>\s*<span[^>]*>([^<]+)", html)
    r["nationality"] = m.group(1).strip() if m else None
    
    # Height
    m = re.search(r"Altezza[^<]*</span>\s*<span[^>]*>([^<]+)", html)
    if not m:
        m = re.search(r"Height[^<]*</span>\s*<span[^>]*>([^<]+)", html, re.IGNORECASE)
    r["height"] = m.group(1).strip() if m else None
    
    # Foot
    m = re.search(r"Piede[^<]*</span>\s*<span[^>]*>([^<]+)", html)
    if not m:
        m = re.search(r"Foot[^<]*</span>\s*<span[^>]*>([^<]+)", html, re.IGNORECASE)
    r["foot"] = m.group(1).strip() if m else None
    
    # Image
    m = re.search(r'<img[^>]*data-header__portrait[^>]*src="([^"]+)"', html)
    if not m:
        m = re.search(r'class="data-header__profile-image"[^>]*src="([^"]+)"', html)
    if not m:
        m = re.search(r'property="og:image"[^>]*content="([^"]+)"', html)
    r["image_url"] = m.group(1).strip() if m else None
    
    # Shirt number
    m = re.search(r'data-header__shirt-number["\']?\s*>([^<]+)', html)
    r["shirt_number"] = m.group(1).strip() if m else None
    
    # Market value
    m = re.search(r"Marktwert[^<]*</span>\s*<span[^>]*>([^<]+)", html)
    if not m:
        m = re.search(r"Market value[^<]*</span>\s*<span[^>]*>([^<]+)", html, re.IGNORECASE)
    r["market_value"] = m.group(1).strip() if m else None
    
    return r

results = []
for i, (url, key) in enumerate(URLS):
    print(f"[{i+1}/20] {key}...", flush=True)
    data = fetch(url, key)
    results.append(data)
    if i < 19:
        time.sleep(1)

with open("player-data.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\nSaved {len(results)} players to player-data.json")