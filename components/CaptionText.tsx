import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CaptionTextProps {
  caption: string;
  colors: any;
  common: any;
}

const CaptionText = ({ caption, colors, common }: CaptionTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [hasMeasured, setHasMeasured] = useState(false);

  const onTextLayout = (e: any) => {
    if (hasMeasured) return;
    const { lines } = e.nativeEvent;
    if (lines && lines.length > 4) {
      setShowReadMore(true);
    }
    setHasMeasured(true);
  };

  if (!hasMeasured) {
    return (
      <View>
        <Text
          style={[common.body, { color: colors.text, marginTop: 10, marginBottom: 3, fontSize: 14 }]}
          onTextLayout={onTextLayout}
        >
          {caption}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={[common.body, { color: colors.text, marginTop: 10, marginBottom: showReadMore ? 0 : 10, fontSize: 14 }]}
        numberOfLines={expanded ? undefined : 3}
      >
        {caption}
      </Text>
      {showReadMore && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={[common.body, { color: colors.primary || colors.text, marginTop: 4, fontWeight: '600', fontSize: 14 }, { marginBottom: 10 }]}>
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CaptionText;

