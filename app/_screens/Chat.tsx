import React from "react";
import { View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";


const ChatScreen = () => {
  const { colors, theme, toggleTheme, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <View style={[common.screen, common.screenPadding, { gap: 12, justifyContent: "center" }]}>

    </View>
  );
};

export default ChatScreen;

