import React, { type FC } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import type { Achievement } from '../domain/achievements';

const AchievementCard: FC<{
  achievement: Achievement;
  isNext: boolean;
  theme: AppTheme;
  width: number;
}> = ({ achievement, isNext, theme, width }) => {
  const { unlocked, icon, title, description, progress } = achievement;
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 1;
  const progressRatio = unlocked ? 1 : Math.min(current / total, 1);
  const color = unlocked
    ? theme.colors.success
    : isNext
      ? theme.colors.warning
      : theme.colors.textMuted;

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}. ${
        unlocked
          ? 'Completado'
          : `${current} de ${total}, faltan ${Math.max(total - current, 0)}`
      }`}
      style={[
        styles.card,
        {
          backgroundColor: isNext
            ? `${theme.colors.warning}0D`
            : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          width,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}1F` }]}>
          <Ionicons
            name={
              (unlocked
                ? icon
                : 'lock-open-outline') as keyof typeof Ionicons.glyphMap
            }
            size={20}
            color={color}
          />
        </View>
        <View style={styles.statusCopy}>
          <Text style={[styles.status, { color }]}>
            {unlocked
              ? 'COMPLETADO'
              : isNext
                ? 'SIGUIENTE META'
                : 'EN PROGRESO'}
          </Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>

      <View style={styles.progressBlock}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.surfaceSecondary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
                width: `${Math.max(progressRatio * 100, unlocked ? 100 : 4)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
          {unlocked
            ? 'Meta alcanzada'
            : `${current}/${total} · faltan ${Math.max(total - current, 0)}`}
        </Text>
      </View>
    </View>
  );
};

/** Carrusel acotado con progreso, contexto y una siguiente meta visible. */
export const AchievementStrip: FC<{ achievements: Achievement[] }> = ({
  achievements,
}) => {
  const { theme } = useAppTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const cardWidth = Math.min(276, Math.max(224, viewportWidth - 92));
  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  const nextLockedId = achievements.find(
    (achievement) => !achievement.unlocked,
  )?.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            LOGROS
          </Text>
          <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>
            {unlockedCount} de {achievements.length} completados
          </Text>
        </View>
        <View style={styles.swipeHint}>
          <Text style={[styles.swipeText, { color: theme.colors.textMuted }]}>
            Desliza
          </Text>
          <Ionicons
            name="arrow-forward"
            size={15}
            color={theme.colors.textMuted}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        accessibilityLabel="Carrusel de logros"
        alwaysBounceVertical={false}
        decelerationRate="fast"
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardWidth + 12}
        style={styles.scroll}
        contentContainerStyle={styles.strip}
      >
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isNext={achievement.id === nextLockedId}
            theme={theme}
            width={cardWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCopy: { gap: 2 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  summary: { fontSize: 12, lineHeight: 17 },
  swipeHint: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  swipeText: { fontSize: 11, fontWeight: '600' },
  scroll: { maxHeight: 184 },
  strip: { gap: 12, paddingBottom: 2, paddingRight: 44 },
  card: {
    borderWidth: 1,
    gap: 10,
    minHeight: 172,
    padding: 14,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  statusCopy: { flex: 1, gap: 2 },
  status: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  title: { fontSize: 15, fontWeight: '700' },
  description: { flex: 1, fontSize: 12, lineHeight: 17 },
  progressBlock: { gap: 6 },
  progressTrack: { borderRadius: 3, height: 6, overflow: 'hidden' },
  progressFill: { borderRadius: 3, height: '100%' },
  progressText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});
