import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import { AppContent, Standing, StandingScope } from '../../types';
import { numberValue, normalizeStandingRow, standingRows, standingScopes, sortStandingRows } from '../../utils/standings';
import { Button, Field, adminStyles } from './Primitives';

function finalPoints(row: Standing): number {
  return (Number(row.points) || 0) + (Number(row.penalty) || 0);
}

export function StandingsAdmin({ content, onChange }: { content: AppContent; onChange: (next: AppContent) => Promise<void> }) {
  const initialRows = useMemo(() => (content.standings?.length ? content.standings.map(normalizeStandingRow) : []), [content.standings]);
  const [rows, setRows] = useState<Standing[]>(initialRows);
  const [scope, setScope] = useState<StandingScope>('overall');
  const [editClub, setEditClub] = useState<string | null>(null);
  const [formDraft, setFormDraft] = useState('');
  const [newClub, setNewClub] = useState('');

  useEffect(() => {
    setRows(standingRows(content, scope).map(normalizeStandingRow));
  }, [content, scope]);

  const updateRow = (club: string, patch: Partial<Standing>) => {
    setRows((prev) => prev.map((row) => row.club === club ? { ...row, ...patch } : row));
  };

  const save = () => {
    const normalized = sortStandingRows(rows);
    setRows(normalized);
    let next = content;
    if (scope === 'home') next = { ...next, homeStandings: normalized };
    else if (scope === 'away') next = { ...next, awayStandings: normalized };
    else if (scope === 'form') next = { ...next, formStandings: normalized };
    else next = { ...next, standings: normalized };
    void onChange(next);
  };

  const addClub = () => {
    const club = newClub.trim();
    if (!club || rows.some((row) => row.club.toLocaleLowerCase('it') === club.toLocaleLowerCase('it'))) return;
    setRows((prev) => [...prev, normalizeStandingRow({ club, rank: prev.length + 1, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, penalty: 0, form: [] }, prev.length)]);
    setNewClub('');
  };

  const scopedRows = rows;

  return <View style={{ gap: 14 }}>
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Classifica</Text>
      <View style={[adminStyles.row, { marginTop: 8 }]}><Field label="Nuova squadra" value={newClub} onChangeText={setNewClub} /><Button label="+ Squadra" icon="plus-circle-outline" secondary onPress={addClub} /></View>
      <View style={[adminStyles.choices, { marginVertical: 10 }]}>
        {standingScopes.map((s) => <Pressable key={s.value} onPress={() => setScope(s.value)} style={[adminStyles.choice, scope === s.value && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, scope === s.value && adminStyles.choiceTextActive]}>{s.label}</Text></Pressable>)}
      </View>
      <Text style={adminStyles.copy}>
        Modifica i campi manualmente o calcola la classifica dal{' '}
        <Text style={{ fontWeight: '700' }}>Girone</Text>. Le penalità si sommano ai punti sul campo.
        Punti finali = punti + penalità.
      </Text>

      {/* Header */}
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.line, marginTop: 10 }}>
        <Text style={{ flex: 1.8, fontSize: 11, fontWeight: '700' }}>Squadra</Text>
        <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>G</Text>
        <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>V</Text>
        <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>N</Text>
        <Text style={{ flex: 0.8, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>P</Text>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>GF</Text>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>GS</Text>
        <Text style={{ flex: 0.9, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>DR</Text>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>Punti</Text>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>Penal.</Text>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center', color: colors.accentStrong }}>Fin.</Text>
        <Text style={{ width: 24 }} />
      </View>

      {scopedRows.map((row, idx) => <View key={row.club ?? idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.lineSoft, backgroundColor: row.club === 'AC Prato' ? colors.accentSoft : 'transparent' }}>
        <Text style={{ flex: 1.8, fontSize: 12, fontWeight: '700', color: colors.ink }}>{row.rank} {row.club}</Text>
        <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.played}</Text>
        <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.wins}</Text>
        <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.draws}</Text>
        <Text style={{ flex: 0.8, fontSize: 11, textAlign: 'center' }}>{row.losses}</Text>
        <Text style={{ flex: 1, fontSize: 11, textAlign: 'center' }}>{row.goalsFor}</Text>
        <Text style={{ flex: 1, fontSize: 11, textAlign: 'center' }}>{row.goalsAgainst}</Text>
        <Text style={{ flex: 0.9, fontSize: 11, textAlign: 'center', fontWeight: '600' }}>{numberValue(row.goalDifference)}</Text>
        <Text style={{ flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '600' }}>{numberValue(row.points)}</Text>
        <Text style={{ flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '900', color: (Number(row.penalty) || 0) < 0 ? colors.live : colors.muted }}>{String(row.penalty ?? 0)}</Text>
        <Text style={{ flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '900', color: colors.accentStrong }}>{finalPoints(row)}</Text>
        <Pressable onPress={() => setRows((prev) => prev.filter((r) => r.club !== row.club))} style={{ width: 24, alignItems: 'center' }}><MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.mutedDark} /></Pressable>
      </View>)}

      <View style={{ marginTop: 14 }}>
        <Button label="Salva classifica" icon="content-save-outline" onPress={save} />
      </View>
    </View>

    {/* Manual edit of single row */}
    <View style={adminStyles.panel}>
      <Text style={adminStyles.title}>Modifica manuale riga</Text>
      <Text style={adminStyles.copy}>Scegli una squadra e modifica i valori statistici.</Text>
      <View style={[adminStyles.row, { marginTop: 10 }]}>
        {scopedRows.map((row) => <Pressable key={row.club} onPress={() => { setEditClub(row.club); setFormDraft((row.form ?? []).join(' ')); }} style={[adminStyles.choice, editClub === row.club && adminStyles.choiceActive]}><Text style={[adminStyles.choiceText, editClub === row.club && adminStyles.choiceTextActive]}>{row.club}</Text></Pressable>)}
      </View>
      {editClub && (() => {
        const row = scopedRows.find((r) => r.club === editClub);
        if (!row) return null;
        return <View style={{ marginTop: 12, gap: 6 }}>
          <View style={adminStyles.row}>
            <Field label="Partite giocate" value={String(row.played)} onChangeText={(v) => updateRow(editClub, { played: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Vittorie" value={String(row.wins)} onChangeText={(v) => updateRow(editClub, { wins: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Pareggi" value={String(row.draws)} onChangeText={(v) => updateRow(editClub, { draws: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Sconfitte" value={String(row.losses)} onChangeText={(v) => updateRow(editClub, { losses: Number(v) || 0 })} keyboardType="numeric" />
          </View>
          <View style={adminStyles.row}>
            <Field label="Gol fatti" value={String(row.goalsFor)} onChangeText={(v) => updateRow(editClub, { goalsFor: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Gol subiti" value={String(row.goalsAgainst)} onChangeText={(v) => updateRow(editClub, { goalsAgainst: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Punti" value={String(row.points)} onChangeText={(v) => updateRow(editClub, { points: Number(v) || 0 })} keyboardType="numeric" />
            <Field label="Penalità" value={String(row.penalty ?? 0)} onChangeText={(v) => updateRow(editClub, { penalty: Number(v) || 0 })} keyboardType="numeric" />
          </View>
          <Field label="Forma (es. W D L)" value={formDraft} onChangeText={setFormDraft} />
          <Button label="Applica forma" icon="check" secondary onPress={() => { const form = formDraft.toUpperCase().split(/[\s,;|\-]+/).map((c) => c === 'V' ? 'W' : c === 'N' ? 'D' : c === 'P' ? 'L' : c).filter((c): c is 'W' | 'D' | 'L' => c === 'W' || c === 'D' || c === 'L').slice(-5); updateRow(editClub, { form }); Alert.alert('Forma aggiornata', form.join(' ')); }} />
        </View>;
      })()}
    </View>
  </View>;
}
