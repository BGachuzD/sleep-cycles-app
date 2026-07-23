import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { DreamEntry } from '../../domain/dreamEntry';
import type { AppTheme } from '../../theme/theme';
import { formatTime } from '../../utils/sleep';
import { styles } from './styles';

function formatDreamWhen(dream: DreamEntry): string {
  const dreamDate = new Date(`${dream.date}T12:00:00`);
  const loggedAt = new Date(dream.loggedAt);
  const date = dreamDate.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  return `Sueño del ${date} · anotado ${formatTime(loggedAt)}`;
}

export const DreamCard: FC<{
  dream: DreamEntry;
  onDelete: () => void;
  theme: AppTheme;
}> = ({ dream, onDelete, theme }) => {
  const moodColor =
    dream.mood === 1
      ? theme.colors.danger
      : dream.mood === 2
        ? theme.colors.success
        : theme.colors.textMuted;
  const moodIcon =
    dream.mood === 1
      ? 'thunderstorm-outline'
      : dream.mood === 2
        ? 'sparkles-outline'
        : 'cloudy-night-outline';

  return (
    <View
      style={[
        styles.dreamCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={styles.dreamCardHeader}>
        <View
          style={[
            styles.moodPill,
            {
              backgroundColor: `${moodColor}1F`,
              borderColor: `${moodColor}55`,
            },
          ]}
        >
          <Ionicons name={moodIcon} size={14} color={moodColor} />
        </View>
        <Text style={[styles.dreamWhen, { color: theme.colors.textMuted }]}>
          {formatDreamWhen(dream)}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Eliminar sueño"
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      {!!dream.tags?.length && (
        <View style={styles.tagRow}>
          {dream.tags.map((t) => (
            <View
              key={t}
              style={[
                styles.tagPill,
                {
                  backgroundColor: `${theme.colors.accent[500]}14`,
                  borderColor: `${theme.colors.accent[500]}33`,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { color: theme.colors.accent[300] },
                ]}
              >
                {t}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!!dream.note && (
        <Text style={[styles.dreamNote, { color: theme.colors.textSecondary }]}>
          {dream.note}
        </Text>
      )}
    </View>
  );
};
