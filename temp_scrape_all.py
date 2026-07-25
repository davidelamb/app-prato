import urllib.request, urllib.parse, re, json, time

# All 20 players with confirmed TM IDs
players_tm = [
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

role_map = {
    'POR': 'Portiere',
    'DC': 'Difensore',
    'TD': 'Difensore',
    'TS': 'Difensore',
    'CC': 'Centrocampista',
    'CEN': 'Centrocampista',
    'M': 'Centrocampista',
    'AS': 'Attaccante',
    'AD': 'Attaccante',
    'CS': 'Attaccante',
    'SP': 'Attaccante',
    'P': 'Attaccante',
    'TQ': 'Centrocampista',
    'ES': 'Difensore',
}

for tm_id, known_name in players_tm:
    query = urllib.parse.quote(known_name)
    url = f'https://www.transfermarkt.it/schnellsuche/ergebnis/schnellsuche?query={query}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(json.dumps({'id': tm_id, 'name': known_name, 'error': str(e)}, ensure_ascii=False))
        continue

    # Find all search result rows
    rows = re.split(r'<tr[^>]*>', html)
    found = None
    for row in rows:
        # Check if this row contains our target TM ID and AC Prato
        if f'/profil/spieler/{tm_id}' in row and 'AC Prato' in row:
            found = row
            break

    if not found:
        print(json.dumps({'id': tm_id, 'name': known_name, 'error': 'not found in search results'}, ensure_ascii=False))
        continue

    # Name
    name_match = re.search(r'<a title="([^"]+)" href="/[^/]+/profil/spieler/' + str(tm_id) + r'">', found)
    name = name_match.group(1).strip() if name_match else known_name

    # Image
    img_match = re.search(r'<img src="(https://img\.a\.transfermarkt\.technology/portrait/small/' + str(tm_id) + r'-[^"]+)"', found)
    img = img_match.group(1) if img_match else '?'

    # Medium image
    img_medium = img.replace('/small/', '/medium/') if img != '?' else '?'

    # Role - the first <td class="zentriert"> after the player link table
    # Parse from the row: after </table></td> comes role, then club logo, then age
    cells = re.findall(r'<td class="zentriert">(.*?)</td>', found, re.DOTALL)
    role_abbr = '?'
    age = '?'
    if len(cells) >= 3:
        # First zentriert is role abbreviation
        role_abbr = re.sub(r'<[^>]+>', '', cells[0]).strip()
        # Second zentriert has club logo - skip
        # Third zentriert is age
        age = re.sub(r'<[^>]+>', '', cells[2]).strip() if len(cells) >= 3 else '?'

    role = role_map.get(role_abbr, role_abbr)

    # Nationality - flag image title
    nat_match = re.search(r'<img src="[^"]*flagge/verysmall/\d+\.png[^"]*" title="([^"]+)"', found)
    nat = nat_match.group(1) if nat_match else '?'

    # Market value
    mval_match = re.search(r'<td class="rechts hauptlink">([^<]+)</td>', found)
    mval = mval_match.group(1).strip() if mval_match else '?'

    result = {
        'tm_id': tm_id,
        'name': name,
        'role': role,
        'role_abbr': role_abbr,
        'age': age,
        'nat': nat,
        'mval': mval,
        'img_small': img,
        'img_medium': img_medium,
    }
    print(json.dumps(result, ensure_ascii=False))
    time.sleep(1)