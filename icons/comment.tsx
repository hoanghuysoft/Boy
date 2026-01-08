import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface CommentIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const CommentIcon = ({
    size = 24,
    color = "#000",
    ...props
}: CommentIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="1 2 22 21" // Cropped to remove empty space around the path
        fill={color}
        {...props}
    >
        <Path d="M1 6a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-4.8l-5.105 2.836A1.41 1.41 0 0 1 7 21.604V20H5a4 4 0 0 1-4-4V6Zm8 12v2.601l4.229-2.35.453-.251H19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4ZM7 8a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7Zm-1 5a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H7a1 1 0 0 0-1 1Z" />
    </Svg>
);

export default CommentIcon;