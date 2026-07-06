import { createIconSet } from '@react-native-vector-icons/common';
import glyphMap from '../assets/fonts/tdesign/glyphmap.json';

export const TDesignIcon = createIconSet(glyphMap, {
  postScriptName: 'tdesignExplorerFont', // The unique patched iOS PostScript font name
  fontFileName: 'tdesign.ttf',          // The Android font file name / family basename
  fontSource: require('../assets/fonts/tdesign/tdesign.ttf'),
});

export type TDesignIconName = keyof typeof glyphMap;

export default TDesignIcon;
