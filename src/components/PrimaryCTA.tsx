import { Ionicons } from '@expo/vector-icons';
import React, { type FC } from 'react';

import { PillButton } from './ui';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
};

/** CTA histórico de la app, ahora respaldado por el botón del design system. */
export const PrimaryCTA: FC<Props> = ({
  label,
  icon,
  onPress,
  trailingIcon = 'chevron-forward',
}) => (
  <PillButton
    label={label}
    icon={icon}
    trailingIcon={trailingIcon}
    onPress={onPress}
  />
);
