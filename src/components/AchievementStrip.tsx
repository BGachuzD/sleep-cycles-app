import React, { FC } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import type { Achievement } from '../domain/achievements';

const AchievementChip: FC<{ achievement: Achievement; theme: AppTheme }> = ({
  achievement,
  theme,
}) => {
  const { unlocked, icon, title, progress } = achievement;
  const color = unlocked ? theme.colors.accent[400] : theme.colors.textMuted;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: theme.colors.surface,
          borderColor: unlocked ? theme.colors.accent[500] : theme.colors.border,
          borderWidth: unlocked ? 1.5 : 1,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: unlocked
              ? `${theme.colors.accent[500]}1F`
              : `${theme.colors.textMuted}1F`,
          },
        ]}
      >
        <Ionicons
          name={(unlocked ? icon : 'lock-closed') as keyof typeof Ionicons.glyphMap}
          size={18}
          color={color}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: unlocked ? theme.colors.textPrimary : theme.colors.textMuted },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {unlocked ? (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
          <Text style={[styles.doneText, { color: theme.colors.success }]}>
            Logrado
          </Text>
        </View>
      ) : progress ? (
        <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
          {progress.current}/{progress.total}
        </Text>
      ) : null}
    </View>
  );
};

/** Tira horizontal de logros (desbloqueados primero). */
export const AchievementStrip: FC<{ achievements: Achievement[] }> = ({
  achievements,
}) => {
  const { theme } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {achievements.map((a) => (
        <AchievementChip key={a.id} achievement={a} theme={theme} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strip: { gap: 10, paddingVertical: 2, paddingRight: 4 },
  chip: { width: 122, padding: 12, gap: 8, alignItems: 'flex-start' },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 12, fontWeight: '800', lineHeight: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontSize: 11, fontWeight: '700' },
  progressText: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
