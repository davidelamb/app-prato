import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { colors } from '../../theme';
import { AppContent, StandingScope } from '../../types';
import { recalculateContentStandings, sortStandingRows, standingRows, standingScopes } from '../../utils/standings';
import { normalizeTeamName } from '../../utils/team-names';
import { Button, Field, adminStyles } from './Primitives';

export function StandingsAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const [scope, setScope] = useState<StandingScope>('overall');
  const [penalties, setPenalties] = useState<Record<string, string>>({});

  useEffect(() => {
    setPenalties(Object.fromEntries((content.standings ?? []).map((row) => [normalizeTeamName(row.club), String(row.penalty ?? 0)])));
  }, [content.standings]);

  const rows = useMemo(() => standingRows(content, scope), [content, scope]);

  const savePenalties = async () => {
    const invalid = Object.values(penalties).some((value) => !/^(-[1-9]\d*|0)$/.test(value.trim()));
    if (invalid) return Alert.alert('Penalità non valida', 'Sono ammessi soltanto 0 o numeri interi negativi (-1, -2, -3 ecc.). I valori positivi, i decimali e il testo non sono accettati.');
    const standings = (content.standings ?? []).map((row) => ({
      ...row,
      penalty: Number(penalties[normalizeTeamName(row.club)] ?? row.penalty ?? 0),
    }));
    const nextBase = { ...content, standings };
    const next = content.groupMatches?.length
      ? recalculateContentStandings(nextBase, content.groupMatches)
      : { ...nextBase, standings: sortStandingRows(standings) };
    await onChange(next);
    Alert.alert('Penalità salvate', 'La classifica generale è stata riordinata automaticamente.');
  };

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Classifica automatica</Text>
      <Text style={adminStyles.copy}>Partite, vittorie, pareggi, sconfitte, gol e punti derivano dai risultati del Girone. Qui puoi modificare soltanto le penalità.</Text>
      <View style={adminStyles.choices}>
        {standingScopes.map((item) => <Pressable key={item.value} onPress={() => setScope(item.value)} style={[adminStyles.choice, scope === item.value && adminStyles.choiceActive]}>
          <Text style={[adminStyles.choiceText, scope === item.value && adminStyles.choiceTextActive]}>{item.label}</Text>
        </Pressable>)}
      </View>
    </View>

    <View style={adminStyles.panel}>
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.line }}>
        <Text style={{ flex: 2.4, fontSize: 11, fontWeight: '900' }}>Squadra</Text>
        <Text style={{ width: 30, fontSize: 11, textAlign: 'center', fontWeight: '900' }}>G</Text>
        <Text style={{ width: 30, fontSize: 11, textAlign: 'center', fontWeight: '900' }}>GF</Text>
        <Text style={{ width: 30, fontSize: 11, textAlign: 'center', fontWeight: '900' }}>GS</Text>
        <Text style={{ width: 38, fontSize: 11, textAlign: 'center', fontWeight: '900' }}>PT</Text>
      </View>
      {rows.map((row) => <View key={row.club} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.lineSoft }}>
        <Text style={{ width: 26, color: colors.muted, fontWeight: '900' }}>{row.rank}</Text>
        <Text style={{ flex: 1, color: colors.ink, fontWeight: '800' }} numberOfLines={1}>{row.club}</Text>
        <Text style={{ width: 30, textAlign: 'center' }}>{row.played}</Text>
        <Text style={{ width: 30, textAlign: 'center' }}>{row.goalsFor ?? 0}</Text>
        <Text style={{ width: 30, textAlign: 'center' }}>{row.goalsAgainst ?? 0}</Text>
        <Text style={{ width: 38, textAlign: 'center', color: colors.accentStrong, fontWeight: '900' }}>{row.points + (row.penalty ?? 0)}</Text>
      </View>)}
      {!rows.length ? <Text style={adminStyles.copy}>Inserisci prima le squadre e le partite nella sezione Girone.</Text> : null}
    </View>

    {scope === 'overall' ? <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Penalità</Text>
      <Text style={adminStyles.copy}>Inserisci valori interi negativi. Lo zero rimuove la penalità.</Text>
      <View style={adminStyles.list}>
        {(content.standings ?? []).map((row) => {
          const key = normalizeTeamName(row.club);
          return <View key={row.club} style={[adminStyles.listRow, { flexWrap: 'wrap' }]}>
            <Text style={[adminStyles.listTitle, { flex: 1, minWidth: 170 }]}>{row.club}</Text>
            <View style={{ width: 150 }}>
              <Field label="Punti penalità" value={penalties[key] ?? '0'} onChangeText={(value) => setPenalties((current) => ({ ...current, [key]: value }))} keyboardType="default" />
            </View>
          </View>;
        })}
      </View>
      <Button label="Salva penalità" icon="content-save-check-outline" onPress={() => void savePenalties()} />
    </View> : null}
  </View>;
}
