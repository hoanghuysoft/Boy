import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface BookmarkSolidIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const BookmarkSolidIcon = ({
    size = 24,
    color = "#000",
    ...props
}: BookmarkSolidIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="3 2 18 20.3"
        fill={color}
        {...props}
    >
        <Path d="M19 2H5a2 2 0 0 0-2 2v16.887c0 1.266 1.382 2.048 2.469 1.399L12 18.366l6.531 3.919c1.087.652 2.469-.131 2.469-1.397V4a2 2 0 0 0-2-2Z" />
    </Svg>
)

export default BookmarkSolidIcon;
