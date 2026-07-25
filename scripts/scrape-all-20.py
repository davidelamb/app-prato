import urllib.request, re, json, time

# All 20 players: TM ID, name
players = [
    (1056751, "Emanuele Ribero"),
    (1058885, "Gabriel Furghieri"),
    (207965, "Giacomo Risaliti"),
    (331838, "Lorenzo Polvani"),
    (211416, "Erik Panizzi"),
    (280044, "Luca Zanon"),
    (1089757, "Lorenzo Pucci"),
    (1345725, "Karim Zakaria"),
    (394777, "Isaia Lattarulo"),
    (459704, "Mattia Fiorini"),
    (373436, "Simone Greselin"),
    (340447, "Emanuele Spinozzi"),
    (342350, "Francesco D'Orsi"),
    (1317388, "Luca Sermenghi"),
    (1296430, "Riccardo Biguzzi"),
    (599009, "Edoardo Marzierli"),
    (395870, "Francesco Verde"),
    (458165, "Giacomo Benedetti"),
    (568709, "Francesco Barranca"),
    (537455, "Giammarco Caon"),
]

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

results = []
for tm_id, known_name in players:
    url = f'https://www.transfermarkt.it/{known_name.lower().replace(" ", "-").replace("'", "")}/profil/spieler/{tm_id}'
    print(f'Fetching: {url}')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        resp = urllib.request.urlopen(req, timeout=15)
        html = resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f'  ERROR: {e}')
        results.append({'id': tm_id, 'name': known_name, 'error': str(e)})
        continue

    # Name from <h1>
    name = known_name
    nm = re.search(r'<h1[^>]*data-header__headline-wrapper[^>]*>.*?<strong>(.*?)</strong>', html, re.DOTALL)
    if not nm:
        nm = re.search(r'<title>(.*?)\s*-\s*Profilo', html)
    if nm:
        name = nm.group(1).strip()

    # Position
    pos = None
    pm = re.search(r'position__position">([^<]+)<', html)
    if pm:
        pos = pm.group(1).strip()

    # Birth date and age
    birth_date = None
    age = None
    bm = re.search(r'<span\s+itemprop="birthDate">\s*<a[^>]*>([^<]+)</a>\s*\((\d+)\)', html)
    if not bm:
        bm = re.search(r'<span\s+itemprop="birthDate">\s*([^<(]+)\s*\((\d+)\)', html)
    if bm:
        birth_date = bm.group(1).strip()
        age = int(bm.group(2).strip())

    # Birthplace
    birthplace = None
    bpm = re.search(r'<span\s+itemprop="birthPlace">\s*<span[^>]*>([^<]+)</span>', html)
    if not bpm:
        bpm = re.search(r'<span\s+itemprop="birthPlace">\s*([^<]+)\s*</span>', html)
    if bpm:
        birthplace = bpm.group(1).strip()

    # Nationality
    nationality = None
    natm = re.search(r'<span\s+itemprop="nationality">\s*([^<]+)\s*</span>', html)
    if natm:
        nationality = natm.group(1).strip()

    # Height
    height = None
    hm = re.search(r'<span\s+itemprop="height"[^>]*>([^<]+)</span>', html)
    if hm:
        height = hm.group(1).strip()

    # Foot
    foot = None
    fm = re.search(r'<span>Piede:\s*</span>\s*<span[^>]*>([^<]+)</span>', html)
    if fm:
        foot = fm.group(1).strip()

    # Jersey number
    number = None
    numm = re.search(r'class="rueckennummer">(\d+)</span>', html)
    if numm:
        number = int(numm.group(1))

    # Market value
    market_value = None
    mvm = re.search(r'data-header__market-value-wrapper[^>]*>([^<]+)</div>', html)
    if not mvm:
        mvm = re.search(r'class="data-header__market-value[^"]*"[^>]*>([^<]+)</div>', html)
    if not mvm:
        mvm = re.search(r'Valore\s*attuale[^<]*</span>\s*<span[^>]*>([^<]+)</span>', html, re.IGNORECASE)
    if not mvm:
        mvm = re.search(r'currentMarketValue[^>]*>([^<]+)</', html)
    if mvm:
        market_value = mvm.group(1).strip().replace('&nbsp;', ' ')

    # Contract
    contract = None
    cm = re.search(r'Scadenza\s*contratto[^<]*</span>\s*<span[^>]*>([^<]+)</span>', html, re.IGNORECASE)
    if cm:
        contract = cm.group(1).strip()

    # Image URL (medium)
    img_url = None
    imm = re.search(r'data-src="(https://img\.a\.transfermarkt\.technology/portrait/medium/\d+-\d+\.(?:png|jpg|jpeg)\?lm=\d+)"', html)
    if not imm:
        imm = re.search(r'<img[^>]*src="(https://img\.a\.transfermarkt\.technology/portrait/medium/\d+-\d+\.(?:png|jpg|jpeg)\?lm=\d+)"', html)
    if imm:
        img_url = imm.group(1)

    result = {
        'tm_id': tm_id,
        'name': name,
        'position': pos,
        'birth_date': birth_date,
        'age': age,
        'birthplace': birthplace,
        'nationality': nationality,
        'height': height,
        'foot': foot,
        'number': number,
        'market_value': market_value,
        'contract': contract,
        'image_url': img_url,
        'profile_url': f'https://www.transfermarkt.it/profil/spieler/{tm_id}',
    }
    results.append(result)
    print(f'  -> {name} | {pos} | #{number} | {birth_date} ({age}) | {height} | {foot} | {nationality} | {market_value} | {contract} | img={img_url is not None}')
    time.sleep(0.5)

with open('scraped-players.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'\nTotal scraped: {len(results)}')