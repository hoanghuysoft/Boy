import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useThemeContext } from "@/context/ThemeContext";
import { FlexText } from "@/components/FlexText";
import { saveFBAuth } from "@/services/fbmusic";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons/static";

const FB_LOGIN_URL = "https://www.facebook.com/login/";

interface FBAuthWebViewProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

// Injected JS: extract fb_dtsg and c_user from the page after login
const INJECTED_JS = `
(function () {
  setInterval(() => {
    try {
      const metas = document.querySelectorAll('meta');
      let dtsg = '';
      for (const m of metas) {
        if (m.name === 'fb:dtsg' || m.getAttribute('data-default') === 'fb_dtsg') {
          dtsg = m.content || '';
          break;
        }
      }

      // Try require-based extraction (works on full FB web)
      try {
        const mod = require('DTSGInitData');
        if (mod && mod.token) dtsg = mod.token;
      } catch (_) {}

      // Extract c_user from cookie
      const cookies = document.cookie.split(';').map(c => c.trim());
      let cUser = '';
      let xs = '';
      let fr = '';
      let sb = '';
      let datr = '';
      for (const c of cookies) {
        if (c.startsWith('c_user=')) cUser = c.slice(7);
        else if (c.startsWith('xs=')) xs = c.slice(3);
        else if (c.startsWith('fr=')) fr = c.slice(3);
        else if (c.startsWith('sb=')) sb = c.slice(3);
        else if (c.startsWith('datr=')) datr = c.slice(5);
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: 'DEBUG', 
        info: 'c_user: ' + (cUser ? 'FOUND' : 'MISSING') + ' | dtsg: ' + (dtsg ? 'FOUND' : 'MISSING')
      }));

      if (cUser && dtsg) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FB_AUTH', cUser, dtsg, xs, fr, sb, datr }));
      }
    } catch (e) {}
  }, 1000);
  true;
})();
`;

export const FBAuthWebView: React.FC<FBAuthWebViewProps> = ({ onSuccess, onCancel }) => {
    const { colors } = useThemeContext();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState("Waiting for JS injection...");
    // Stable Animated.Value — useMemo so it's created once, not during render each time
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleMessage = useCallback(
        (event: { nativeEvent: { data: string } }) => {
            try {
                const msg = JSON.parse(event.nativeEvent.data);
                if (msg.type === "DEBUG") {
                    setDebugInfo(msg.info);
                }
                if (msg.type === "FB_AUTH" && msg.cUser && msg.dtsg) {
                    saveFBAuth({
                        cUser: msg.cUser,
                        xs: msg.xs || "",
                        fr: msg.fr,
                        sb: msg.sb,
                        datr: msg.datr,
                        fbDtsg: msg.dtsg,
                    });
                    onSuccess();
                }
            } catch { /* ignore */ }
        },
        [onSuccess]
    );

    const handleNavChange = useCallback(() => {
        // Navigation state changes handled via injected JS message bridge
    }, []);

    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999, opacity: fadeAnim, paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.containerContent, borderBottomColor: colors.divider }]}>
                <FlexText style={{ fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 }}>
                    Sign in to Facebook
                </FlexText>
                {onCancel && (
                    <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={22} color={colors.muted} />
                    </TouchableOpacity>
                )}
            </View>

            <FlexText style={{ fontSize: 12, color: colors.muted, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.background }}>
                Your login is only used to access FB Music. Credentials are stored locally.
            </FlexText>
            <View style={{ backgroundColor: '#111', padding: 8, paddingHorizontal: 16 }}>
                <FlexText style={{ color: '#0f0', fontSize: 11, fontFamily: 'monospace' }}>
                    DEBUG: {debugInfo}
                </FlexText>
            </View>

            {isLoading && (
                <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: colors.background, zIndex: 1 }]}>
                    <ActivityIndicator color={colors.secondary} size="large" />
                    <FlexText style={{ marginTop: 12, color: colors.muted }}>Loading Facebook…</FlexText>
                </View>
            )}

            <WebView
                source={{ uri: FB_LOGIN_URL }}
                style={{ flex: 1, backgroundColor: colors.background }}
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
                injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
                injectedJavaScript={INJECTED_JS}
                onMessage={handleMessage}
                onNavigationStateChange={handleNavChange}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                allowsInlineMediaPlayback
                // Keep credentials — same webview session
                incognito={false}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});
