import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  computeCompleteCycles,
  computeSleepMinutes,
  type SleepLogEntry,
} from '../../domain/sleepLog';
import type { AppTheme } from '../../theme/theme';
import { formatDuration, formatTime } from '../../utils/sleep';
import { FEELING_ICON } from './constants';

// ─────────────────────────────────────────────
// EntryRow del historial
// ─────────────────────────────────────────────
export const EntryRow: FC<{
  entry: SleepLogEntry;
  cycleMins: number;
  isFromHealthKit: boolean;
  theme: AppTheme;
}> = ({ entry, cycleMins, isFromHealthKit, theme }) => {
  const mins = computeSleepMinutes(entry);
  const cycles = computeCompleteCycles(mins, cycleMins);
  const bedDate = new Date(entry.bedTimeISO);
  const wakeDate = new Date(entry.wakeTimeISO);
  const isGood = mins >= 5 * cycleMins;
  const feeling = FEELING_ICON[entry.feeling];
  const feelingColor = theme.colors[feeling.colorKey];

  return (
    <View
      style={[
        entryStyles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View
        style={[
          entryStyles.dot,
          {
            backgroundColor: isGood
              ? theme.colors.accent[500]
              : theme.colors.danger,
          },
        ]}
      />
      <View style={entryStyles.content}>
        <View style={entryStyles.dateRow}>
          <Text
            style={[
              entryStyles.date,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {entry.date}
          </Text>
          {isFromHealthKit && (
            <View
              style={[
                entryStyles.sourceBadge,
                {
                  backgroundColor: `${theme.colors.success}1F`,
                  borderColor: `${theme.colors.success}55`,
                },
              ]}
            >
              <Ionicons name="heart" size={8} color={theme.colors.success} />
              <Text
                style={[
                  entryStyles.sourceBadgeText,
                  { color: theme.colors.success },
                ]}
              >
                Salud
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            entryStyles.times,
            { color: theme.colors.textPrimary, fontSize: theme.type.body },
          ]}
        >
          {formatTime(bedDate)} → {formatTime(wakeDate)}
        </Text>
      </View>
      <View style={entryStyles.right}>
        <Text
          style={[
            entryStyles.duration,
            { color: theme.colors.heroText, fontSize: theme.type.body },
          ]}
        >
          {formatDuration(mins)}
        </Text>
        <Text
          style={[
            entryStyles.cycles,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {cycles} ciclos
        </Text>
      </View>
      <View
        style={[
          entryStyles.feelingPill,
          {
            backgroundColor: `${feelingColor}1F`,
            borderColor: `${feelingColor}55`,
          },
        ]}
      >
        <Ionicons name={feeling.icon} size={14} color={feelingColor} />
      </View>
    </View>
  );
};

const entryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { flex: 1 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  date: { fontWeight: '700', letterSpacing: 0.3 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  times: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  right: { alignItems: 'flex-end' },
  duration: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  cycles: { marginTop: 2 },
  feelingPill: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
