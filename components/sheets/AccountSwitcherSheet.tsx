import { useThemeContext } from "@/context/ThemeContext";
import {
  getSavedAccounts,
  removeAccount,
  StoredAccount,
  switchAccount,
  updateAccountProfile,
} from "@/services/accountManager";
import { signInWithGoogle, signOutAll } from "@/services/login";
import { getActiveUserId } from "@/services/storage";
import { createCommonStyles } from "@/styles/common";
import type { AccountSwitcherSheetHandle } from "@/types/sheetHandles";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { Button } from "heroui-native";
import { Spinner } from "panelui-native";
import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../FlexText";

interface AccountSwitcherSheetProps {
  onDismiss?: () => void;
  onAccountSwitched?: (userId: string) => void;
}

export const AccountSwitcherSheet = memo(
  forwardRef<AccountSwitcherSheetHandle, AccountSwitcherSheetProps>(
    ({ onDismiss, onAccountSwitched }, ref) => {
      const { t } = useTranslation();
      const { colors, typography } = useThemeContext();
      const common = React.useMemo(() => createCommonStyles(colors, typography), [colors, typography]);
      const insets = useSafeAreaInsets();
      const queryClient = useQueryClient();
      const cachedMe = queryClient.getQueryData<any>(["profile", "me"]);

      const [index, setIndex] = useState(0);
      const [accounts, setAccounts] = useState<StoredAccount[]>([]);
      const [activeId, setActiveId] = useState<string | null>(null);
      const [isBusy, setIsBusy] = useState(false);
      const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);

      const controllerRef = useRef<AccountSwitcherSheetHandle>({
        present: () => { },
        dismiss: () => { },
      });

      const refreshAccounts = useCallback(() => {
        const current = getActiveUserId();
        const me = queryClient.getQueryData<any>(["profile", "me"]);
        if (me && current) {
          updateAccountProfile(current, {
            name: me.name,
            username: me.username,
            avatarUrl: me.avatar_url,
          });
        }
        const list = getSavedAccounts();
        setAccounts(list);
        setActiveId(current);
      }, [queryClient]);

      useImperativeHandle(
        ref,
        () => ({
          present: () => {
            refreshAccounts();
            setIndex(1);
          },
          dismiss: () => {
            setIndex(0);
          },
        }),
        [refreshAccounts]
      );

      const handleIndexChange = useCallback((newIndex: number) => {
        setIndex(newIndex);
        if (newIndex === 0) {
          onDismiss?.();
        }
      }, [onDismiss]);

      const handleSwitch = useCallback(
        async (account: StoredAccount) => {
          if (account.id === activeId || isBusy) return;
          try {
            setIsBusy(true);
            setSwitchingUserId(account.id);
            await switchAccount(account.id);
            setActiveId(account.id);
            onAccountSwitched?.(account.id);
            setIndex(0);
          } catch (e: any) {
            console.error("Account switch error:", e);
            Alert.alert("Error", e?.message || "Could not switch account");
          } finally {
            setIsBusy(false);
            setSwitchingUserId(null);
          }
        },
        [activeId, isBusy, onAccountSwitched]
      );

      const handleAddAccount = useCallback(async () => {
        if (isBusy) return;
        try {
          setIsBusy(true);
          const session = await signInWithGoogle({ isAddingAccount: true });
          if (session?.user) {
            refreshAccounts();
            setIndex(0);
          }
        } catch (e: any) {
          console.error("Add account error:", e);
        } finally {
          setIsBusy(false);
        }
      }, [isBusy, refreshAccounts]);

      const handleRemoveAccount = useCallback(
        (account: StoredAccount) => {
          Alert.alert(
            t("settings.logout", "Sign Out"),
            `Remove "${account.fullName || account.email}" from this device?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                  try {
                    setIsBusy(true);
                    const { remainingAccounts, switchedTo } = await removeAccount(account.id);
                    setAccounts(remainingAccounts);
                    setActiveId(switchedTo);
                    if (!switchedTo) {
                      setIndex(0);
                    }
                  } catch (e) {
                    console.error("Remove account error:", e);
                  } finally {
                    setIsBusy(false);
                  }
                },
              },
            ]
          );
        },
        [t]
      );

      const handleSignOutAll = useCallback(() => {
        Alert.alert(
          "Sign Out of All Accounts",
          "This will sign out and clear cached data for all accounts on this device.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out All",
              style: "destructive",
              onPress: async () => {
                try {
                  setIsBusy(true);
                  await signOutAll();
                  setIndex(0);
                } catch (e) {
                  console.error("Sign out all error:", e);
                } finally {
                  setIsBusy(false);
                }
              },
            },
          ]
        );
      }, []);

      return (
        <ModalBottomSheet
          index={index}
          onIndexChange={handleIndexChange}
          detents={[0, "content"]}
          scrimColor={colors.scrim}
          scrimOpacities={[0, 0.5, 1]}
          extendUnderStatusBar
          surface={
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderTopLeftRadius: 36,
                  borderTopRightRadius: 36,
                  overflow: "hidden",
                },
              ]}
            />
          }
        >
          <View
            style={[
              styles.grabber,
              { backgroundColor: colors.outlineVariant, marginTop: 10 },
            ]}
          />

          <View style={[styles.container, { marginBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <FlexText style={[common.heading, { fontSize: 20 }]}>
                {t("settings.switchAccount")}
              </FlexText>
              <TouchableOpacity
                onPress={() => setIndex(0)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Account List */}
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            >
              {accounts.map((acc) => {
                const isActive = acc.id === activeId;
                const isSwitching = switchingUserId === acc.id;

                const displayName = (isActive && cachedMe?.name) ? cachedMe.name : (acc.fullName || acc.email || "Account");
                const avatarUri = (isActive && cachedMe?.avatar_url) ? cachedMe.avatar_url : acc.avatarUrl;
                const displayHandle = (isActive && cachedMe?.username)
                  ? `@${cachedMe.username}`
                  : (acc.username ? `@${acc.username}` : acc.email);

                return (
                  <TouchableOpacity
                    key={acc.id}
                    activeOpacity={isActive ? 1 : 0.7}
                    onPress={() => handleSwitch(acc)}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isActive
                          ? colors.surfaceContainerHigh
                          : colors.surfaceContainer,
                      },
                    ]}
                  >
                    {/* Avatar */}
                    {avatarUri ? (
                      <ExpoImage
                        source={{ uri: avatarUri }}
                        style={[styles.avatar, { backgroundColor: colors.outlineVariant }]}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.fallbackAvatar,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <FlexText
                          style={[common.heading, { color: colors.onPrimaryContainer, fontSize: 18 }]}
                        >
                          {(displayName || "U").charAt(0).toUpperCase()}
                        </FlexText>
                      </View>
                    )}

                    {/* Info */}
                    <View style={styles.accountInfo}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <FlexText
                          style={[
                            common.body,
                            {
                              fontWeight: isActive ? "700" : "500",
                              color: colors.onSurface,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </FlexText>
                        {isActive && (
                          <View
                            style={[
                              styles.activeBadge,
                              { backgroundColor: colors.primaryContainer },
                            ]}
                          >
                            <FlexText
                              style={{
                                fontSize: 11,
                                color: colors.onPrimaryContainer,
                                fontWeight: "600",
                              }}
                            >
                              Active
                            </FlexText>
                          </View>
                        )}
                      </View>

                      {displayHandle && (
                        <FlexText
                          style={[common.bodySmall, { color: colors.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {displayHandle}
                        </FlexText>
                      )}
                    </View>

                    {/* Action / Status */}
                    {isSwitching ? (
                      <Spinner size="sm" color="default" />
                    ) : isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                        style={{ marginLeft: 8 }}
                      />
                    ) : (
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleRemoveAccount(acc)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Add Account Button */}
            <Button
              variant="primary"
              onPress={handleAddAccount}
              isDisabled={isBusy}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              <Button.Label>{t("settings.addAccount")}</Button.Label>
            </Button>

            {/* Sign out all if multiple accounts exist */}
            {accounts.length > 1 && (
              <Button
                variant="danger-soft"
                onPress={handleSignOutAll}
                isDisabled={isBusy}
                style={{ marginTop: 8 }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error || "#ef4444"} />
                <Button.Label>{t("settings.signOutAll")}</Button.Label>
              </Button>
            )}

            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </View>
        </ModalBottomSheet>
      );
    }
  )
);

AccountSwitcherSheet.displayName = "AccountSwitcherSheet";

const styles = StyleSheet.create({
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fallbackAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
});
