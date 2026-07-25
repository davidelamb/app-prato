import urllib.request, re, json, sys

ids_to_scrape = [
    (1056751, "Emanuele Ribero"),
    (1089757, "Lorenzo Pucci"),
    (1345725, "Karim Zakaria"),
    (340447, "Emanuele Spinozzi"),
    (1317388, "Luca Sermenghi"),
    (599009, "Edoardo Marzierli"),
    (568709, "Francesco Barranca"),
    (537455, "Giammarco Caon"),
    (458165, "Giacomo Benedetti"),
]

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

for tm_id, known_name in ids_to_scrape:
    url = f'https://www.transfermarkt.it/someone/profil/spieler/{tm_id}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(json.dumps({'id': tm_id, 'name': known_name, 'error': str(e)}))
        continue

    # Name
    name = known_name
    nm = re.search(r'<h1 class="data-header__headline-wrapper"[^>]*>.*?<strong>(.*?)</strong>', html, re.DOTALL)
    if nm:
        name = nm.group(1).strip()

    # Role
    role = '?'
    rm = re.search(r'<dd class="detail-position__position">(.*?)</dd>', html)
    if rm:
        role = rm.group(1).strip()

    # Birth
    birth = '?'
    bm = re.search(r'<span\s+itemprop="birthDate">\s*(.*?)\s*\((\d+)\)\s*</span>', html)
    if bm:
        birth = f'{bm.group(1).strip()} ({bm.group(2)})'

    # Image URL
    img = '?'
    im = re.search(r'data-src="(https://img\.a\.transfermarkt\.technology/portrait/medium/\d+-\d+\.(?:png|jpg|jpeg)\?lm=\d+)"', html)
    if im:
        img = im.group(1)

    # Height
    height = '?'
    hm = re.search(r'<span\s+itemprop="height">(.*?)</span>', html)
    if hm:
        height = hm.group(1).strip()

    # Foot
    foot = '?'
    fm = re.search(r'<span>Piede:\s*</span>\s*<span[^>]*>(.*?)</span>', html)
    if fm:
        foot = fm.group(1).strip()

    # Nationality
    nat = '?'
    nm2 = re.search(r'<span\s+itemprop="nationality">(.*?)</span>', html)
    if nm2:
        nat = nm2.group(1).strip()

    # Number
    num = '?'
    numm = re.search(r'class="rueckennummer">(\d+)</span>', html)
    if numm:
        num = numm.group(1)

    # Market value
    mval = '?'
    mvm = re.search(r'class="data-header__market-value-wrapper">([\d.,]+\s*(?:mil[a-z]*|mila)\s*€)', html)
    if mvm:
        mval = mvm.group(1).strip()

    # Birthplace
    birthplace = '?'
    bpm = re.search(r'<span\s+itemprop="birthPlace">(.*?)</span>', html)
    if bpm:
        birthplace = bpm.group(1).strip()

    result = {
        'id': tm_id,
        'name': name,
        'role': role,
        'birth': birth,
        'birthplace': birthplace,
        'img': img,
        'height': height,
        'foot': foot,
        'nat': nat,
        'num': num,
        'mval': mval
    }
    print(json.dumps(result, ensure_ascii=False))