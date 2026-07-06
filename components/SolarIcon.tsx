import { createIconSet } from '@react-native-vector-icons/common';
import glyphMap from '../assets/fonts/solar/glyphmap.json';

export const SolarIcon = createIconSet(glyphMap, {
  postScriptName: 'solarIconsExplorerF', // The unique patched iOS PostScript font name
  fontFileName: 'solar.ttf',              // The Android font file name / family basename
  fontSource: require('../assets/fonts/solar/solar.ttf'),
});

export type SolarIconName = keyof typeof glyphMap;

export default SolarIcon;
