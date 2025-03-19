import { createTheme } from '@mantine/core';
import { colors } from './colors';
import { fonts } from './fonts';

export const theme = createTheme({
  fontFamily: fonts.BODY_FONT,
  headings: {
    fontFamily: fonts.HEADER_FONT,
  },
  colors: {
    brand: [
      colors.BLUE_LIGHT,
      colors.BLUE_98,
      colors.BLUE_LIGHT,
      colors.BLUE,
      colors.BLUE,
      colors.BLUE,
      colors.BLUE_PRESSED,
      colors.DARK_BLUE_HOVER,
      colors.DARKEST_BLUE,
      colors.DARKEST_BLUE,
    ],
    accent: [
      colors.TEAL_LIGHT,
      colors.TEAL_LIGHT,
      colors.TEAL_LIGHT,
      colors.TEAL_ACCENT,
      colors.TEAL_ACCENT,
      colors.TEAL_ACCENT,
      colors.TEAL_PRESSED,
      colors.TEAL_PRESSED,
      colors.TEAL_PRESSED,
      colors.TEAL_PRESSED,
    ],
  },
  primaryColor: 'brand',
  primaryShade: 5,
  components: {
    Button: {
      defaultProps: {
        color: 'brand',
      },
    },
    Slider: {
      defaultProps: {
        color: 'brand',
      },
    },
    Tabs: {
      defaultProps: {
        color: 'brand',
      },
    },
  },
});