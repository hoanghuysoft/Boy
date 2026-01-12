import { useSettingsStore } from "@/stores/settings";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";


const ChatScreen = () => {
  const { colors, theme, toggleTheme, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { showSensitiveContent, toggleShowSensitiveContent } = useSettingsStore();

  return (
    <View style={[common.screen, common.screenPadding, { gap: 12, justifyContent: "center" }]}>
      <Text style={common.heading}>Home Screen ({theme})</Text>
      <TouchableOpacity onPress={toggleTheme} style={common.button}>
        <Text style={common.buttonText}>Toggle Theme</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleShowSensitiveContent} style={[common.button, { backgroundColor: showSensitiveContent ? 'red' : 'green' }]}>
        <Text style={common.buttonText}>{showSensitiveContent ? 'Hide Sensitive Content' : 'Show Sensitive Content'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatScreen;
