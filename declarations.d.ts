declare module "*.svg" {
    import React from "react";
    import { SvgProps } from "react-native-svg";
    const content: React.FC<SvgProps>;
    export default content;
}

declare module "@react-native-masked-view/masked-view" {
    import type * as React from "react";
    import type { ViewProps } from "react-native";

    export interface MaskedViewProps extends ViewProps {
        maskElement: React.ReactElement;
        androidRenderingMode?: "software" | "hardware";
    }

    export default class MaskedView extends React.Component<MaskedViewProps> {}
}
