import * as React from "react";
import Svg, { ClipPath, Defs, G, Path, SvgProps } from "react-native-svg";

interface LikeSolidIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const LikeSolidIcon = ({
    size = 48,
    color = "#FFF",
    ...props
}: LikeSolidIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="12 12 24 24"
        {...props}
    >
        <Defs>
            <ClipPath id="a">
                <Path d="M0 0h48v48H0z" />
            </ClipPath>
        </Defs>
        <G clipPath="url(#a)">
            <Path
                fill={color}
                d="M-2.778-10.205c.16-.459.628-.736 1.108-.657l1.04.174a4 4 0 0 1 3.252 4.783L2-3h4.061A3.664 3.664 0 0 1 9.638-.132 3.68 3.68 0 0 1 9 2.849l.02.088A3.814 3.814 0 0 1 8 6.5v.043l-.009.226a2.789 2.789 0 0 1-.136.664l-.106.282A3.755 3.755 0 0 1 4.295 10H.689l-.391-.007a12.008 12.008 0 0 1-5.224-1.388l-.343-.189-.269-.154a1.988 1.988 0 0 0-.863-.26l-.13-.004H-8.5a1.5 1.5 0 0 1-1.5-1.5V.5A1.5 1.5 0 0 1-8.5-1h1.79l.157-.013a1 1 0 0 0 .724-.513l.063-.144 2.988-8.535z"
                transform="translate(24 24)"
            />
        </G>
    </Svg>
)

export default LikeSolidIcon;
