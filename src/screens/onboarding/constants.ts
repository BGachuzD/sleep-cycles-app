import { Dimensions } from 'react-native';

export const { width, height } = Dimensions.get('window');
export const HERO_DIAMETER = Math.min(width * 0.46, 180);
