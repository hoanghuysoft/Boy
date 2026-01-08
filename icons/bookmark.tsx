import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface BookmarkIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const BookmarkIcon = ({
    size = 24,
    color = "#000",
    ...props
}: BookmarkIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="3 2 18 20.3" // Cropped to remove empty horizontal and vertical padding
        fill={color}
        {...props}
    >
        <Path d="M19 2H5a2 2 0 0 0-2 2v16.887c0 1.266 1.382 2.048 2.469 1.399L12 18.366l6.531 3.919c1.087.652 2.469-.131 2.469-1.397V4a2 2 0 0 0-2-2ZM5 20.233V4h14v16.233l-6.485-3.89-.515-.309-.515.309L5 20.233Z" />
    </Svg>
)

export default BookmarkIcon;