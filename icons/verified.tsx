import * as React from "react";
import Svg, { G, Path, SvgProps } from "react-native-svg";

interface VerifiedIconProps extends SvgProps {
  size?: number;
  color?: string;
}

const VerifiedIcon = ({
  size = 24,
  color = "#000",
  ...props
}: VerifiedIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <G>
      <Path
        fill="#fff"
        d="m12 1.5 3.214 2.74 4.21.335.337 4.21L22.5 12l-2.74 3.214-.335 4.21-4.21.337L12 22.5l-3.215-2.74-4.21-.335-.336-4.21L1.5 12l2.74-3.215.335-4.21 4.21-.336L12 1.5Z"
      />
      <Path
        stroke={color}
        strokeLinecap="square"
        strokeWidth={2}
        d="m12 1.5 3.214 2.74 4.21.335.337 4.21L22.5 12l-2.74 3.214-.335 4.21-4.21.337L12 22.5l-3.215-2.74-4.21-.335-.336-4.21L1.5 12l2.74-3.215.335-4.21 4.21-.336L12 1.5Z"
      />
      <Path
        stroke={color}
        strokeLinecap="square"
        strokeWidth={2}
        d="m8 12 3 3 5.5-5.5"
      />
    </G>
  </Svg>
);

export default VerifiedIcon;