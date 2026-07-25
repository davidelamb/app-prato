import re

with open('src/data/simulated-season.ts', 'r') as f:
    content = f.read()

wins = draws = losses = 0
gf = ga = 0

lines = content.split('\n')
match_details = []

for line in lines:
    if 'AC Prato' not in line or 'homeScore' not in line:
        continue
    m = re.search(r"homeScore:\s*(\d+),\s*awayScore:\s*(\d+)", line)
    if not m:
        continue
    hs = int(m.group(1))
    aws = int(m.group(2))
    
    home_match = re.search(r"home:\s*'([^']+)'", line)
    away_match = re.search(r"away:\s*'([^']+)'", line)
    md_match = re.search(r"matchday:\s*(\d+),", line)
    md = int(md_match.group(1)) if md_match else 0
    
    if home_match and 'AC Prato' in home_match.group(1):
        opp = away_match.group(1) if away_match else "?"
        result = f"{hs}-{aws}"
        if hs > aws: 
            wins += 1
            outcome = "W"
        elif hs == aws: 
            draws += 1
            outcome = "D"
        else: 
            losses += 1
            outcome = "L"
        gf += hs
        ga += aws
        home_away = "CASA"
    else:
        opp = home_match.group(1) if home_match else "?"
        result = f"{aws}-{hs}"
        if aws > hs: 
            wins += 1
            outcome = "W"
        elif aws == hs: 
            draws += 1
            outcome = "D"
        else: 
            losses += 1
            outcome = "L"
        gf += aws
        ga += hs
        home_away = "TRAS"
    
    match_details.append((md, home_away, opp, result, outcome))

points = wins * 3 + draws
print(f"=== RISULTATI PRATO (dai match) ===")
print(f"Record: {wins}V, {draws}N, {losses}P = {points} pt")
print(f"GF={gf}, GA={ga}, GD={gf-ga}")
print(f"Totale partite: {wins+draws+losses}")

print(f"\n=== DETTAGLIO PARTITE ===")
for md, ha, opp, res, out in sorted(match_details, key=lambda x: x[0]):
    print(f"  G{md:02d} {ha:4s} vs {opp:30s}  {res:5s}  {out}")

sm = re.search(r"rank:\s*1,\s*club:\s*'AC Prato'.*?wins:\s*(\d+),\s*draws:\s*(\d+),\s*losses:\s*(\d+),\s*goalsFor:\s*(\d+),\s*goalsAgainst:\s*(\d+),\s*goalDifference:\s*(\d+),\s*points:\s*(\d+)", content)
if sm:
    sw, sd, sl, sgf, sga, sgd, spt = int(sm.group(1)), int(sm.group(2)), int(sm.group(3)), int(sm.group(4)), int(sm.group(5)), int(sm.group(6)), int(sm.group(7))
    print(f"\n=== CLASSIFICA PRATO ===")
    print(f"Record: {sw}V, {sd}N, {sl}P = {spt} pt")
    print(f"GF={sgf}, GA={sga}, GD={sgd}")
    print(f"\n=== CONSISTENZA ===")
    if wins == sw and draws == sd and losses == sl and gf == sgf and ga == sga:
        print("OK: DATI COERENTI tra partite e classifica")
    else:
        print("ERRORE: DISCREPANZA tra partite e classifica!")
        if wins != sw: print(f"  Vittorie: match={wins}, classifica={sw}")
        if draws != sd: print(f"  Pareggi: match={draws}, classifica={sd}")
        if losses != sl: print(f"  Sconfitte: match={losses}, classifica={sl}")
        if gf != sgf: print(f"  GF: match={gf}, classifica={sgf}")
        if ga != sga: print(f"  GA: match={ga}, classifica={sga}")

team_count = len(re.findall(r"club:\s*'[^']+',\s*played:\s*\d+", content))
print(f"\nSquadre in classifica: {team_count}")