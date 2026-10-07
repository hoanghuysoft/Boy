import { abbreviateNumber } from "js-abbreviation-number";
import { type TextProps } from "panelui-native";
import React, { useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { FlexText } from "./FlexText";

interface AbbreviatedSlidingNumberProps extends ViewProps {
    value: number;
    digits?: number;
    size?: number;
    weight?: TextProps["weight"];
    color?: string;
}

export const AbbreviatedSlidingNumber = React.memo(function AbbreviatedSlidingNumber({
    value,
    digits = 1,
    size = 24,
    weight = "bold",
    color,
    style,
    ...props
}: AbbreviatedSlidingNumberProps) {
    const formatted = useMemo(() => abbreviateNumber(value || 0, digits), [value, digits]);

    const textStyle = useMemo(
        () => ({ fontSize: size, fontWeight: weight, color: color }),
        [size, weight, color]
    );

    return (
        <View style={style} {...props}>
            <FlexText style={textStyle}>
                {formatted}
            </FlexText>
        </View>
    );
});
AbbreviatedSlidingNumber.displayName = "AbbreviatedSlidingNumber";

