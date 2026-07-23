import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipLabel: { fontWeight: '700', fontSize: 13 },
  dreamCard: { borderWidth: 1, padding: 14, gap: 10 },
  dreamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dreamWhen: { flex: 1, fontSize: 12, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagPillText: { fontSize: 11, fontWeight: '700' },
  dreamNote: { fontSize: 13, lineHeight: 18 },
});
