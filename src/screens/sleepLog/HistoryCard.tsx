import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  computeCompleteCycles,
  computeSleepMinutes,
  type SleepLogEntry,
} from '../../domain/sleepLog';
import type { AppTheme } from '../../theme/theme';
import { formatDuration, formatTime } from '../../utils/sleep';
import { FEELINGS } from './feelings';

export const HistoryCard: FC<{
  entry: SleepLogEntry;
  cycleMins: number;
  isEditing: boolean;
  isFromHealthKit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  theme: AppTheme;
}> = ({
  entry,
  cycleMins,
  isEditing,
  isFromHealthKit,
  onEdit,
  onDelete,
  theme,
}) => {
  const mins = computeSleepMinutes(entry);
  const cycles = computeCompleteCycles(mins, cycleMins);
  const info = FEELINGS[entry.feeling];
  const color = theme.colors[info.colorKey];
  const bedDate = new Date(entry.bedTimeISO);
  const wakeDate = new Date(entry.wakeTimeISO);

  return (
    <View
      style={[
        historyStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderColor: isEditing
            ? theme.colors.accent[500]
            : theme.colors.border,
          borderWidth: isEditing ? 1.5 : 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <View style={historyStyles.left}>
        <View style={historyStyles.dateRow}>
          <Text
            style={[
              historyStyles.date,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {entry.date}
          </Text>
          {isFromHealthKit && (
            <View
              style={[
                historyStyles.sourceBadge,
                {
                  backgroundColor: `${theme.colors.success}1F`,
                  borderColor: `${theme.colors.success}55`,
                },
              ]}
            >
              <Ionicons name="heart" size={9} color={theme.colors.success} />
              <Text
                style={[
                  historyStyles.sourceBadgeText,
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
            historyStyles.time,
            { color: theme.colors.textPrimary, fontSize: theme.type.bodyLarge },
          ]}
        >
          {formatTime(bedDate)} → {formatTime(wakeDate)}
        </Text>
        <Text
          style={[
            historyStyles.detail,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {formatDuration(mins)} · {cycles} ciclos
        </Text>
      </View>

      <View style={historyStyles.right}>
        <View
          style={[
            historyStyles.feelingPill,
            { backgroundColor: `${color}1F`, borderColor: `${color}55` },
          ]}
        >
          <Ionicons name={info.icon} size={16} color={color} />
        </View>
        <View style={historyStyles.actions}>
          <Pressable hitSlop={8} onPress={onEdit}>
            <Ionicons
              name="pencil-outline"
              size={16}
              color={
                isEditing ? theme.colors.accent[400] : theme.colors.textMuted
              }
            />
          </Pressable>
          <Pressable hitSlop={8} onPress={onDelete}>
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const historyStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1, marginRight: 8 },
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
    paddingHorizontal: 6,
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
  time: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  detail: { marginTop: 2 },
  right: { alignItems: 'center', gap: 8 },
  feelingPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
