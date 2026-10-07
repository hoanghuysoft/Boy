import * as React from "react";
import Svg, { ClipPath, Defs, G, Path, SvgProps } from "react-native-svg";

interface SvgComponentProps extends SvgProps {
    size?: number;
    color?: string;
}

const LikeIcon = React.memo(({
    size = 48,
    color = "#FFF",
    ...props
}: SvgComponentProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="12 12 24 24" // Adjusted from 0 0 48 48 to remove outer padding
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
                d="M-2.778-10.205c.16-.459.628-.736 1.108-.657l1.04.174a4 4 0 0 1 3.252 4.783L2-3h4.061A3.664 3.664 0 0 1 9.638-.132 3.68 3.68 0 0 1 9 2.849l.02.088A3.814 3.814 0 0 1 8 6.5v.043l-.009.226a2.789 2.789 0 0 1-.136.664l-.106.282A3.755 3.755 0 0 1 4.295 10H.689l-.391-.007a12.008 12.008 0 0 1-5.224-1.388l-.343-.189-.269-.154a1.988 1.988 0 0 0-.863-.26l-.13-.004H-8.5a1.5 1.5 0 0 1-1.5-1.5V.5A1.5 1.5 0 0 1-8.5-1h1.79l.157-.013a1 1 0 0 0 .724-.513l.063-.144 2.988-8.535zm-1.1 9.196A3 3 0 0 1-6.71 1H-8v4.998h1.469c.696 0 1.38.182 1.985.528l.271.154.285.158A10.007 10.007 0 0 0 .689 8h3.606c.754 0 1.424-.484 1.663-1.199l.031-.127A.827.827 0 0 0 6 6.543v-.872l.587-.586c.388-.388.577-.927.523-1.465l-.038-.231-.02-.086-.209-.901.549-.743c.29-.391.396-.892.293-1.357A1.664 1.664 0 0 0 6.061-1H2a2.004 2.004 0 0 1-1.556-.743 2.004 2.004 0 0 1-.4-1.676l.623-2.904A2 2 0 0 0-.959-8.715l-.21-.035-2.709 7.741z"
                transform="translate(24 24)"
            />
        </G>
    </Svg>
));
LikeIcon.displayName = "LikeIcon";

export default LikeIcon;