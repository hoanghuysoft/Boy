import { FlexText } from '@/components/FlexText';
import { Dialog } from '@/components/ui/organisms/dialog';
import { BanStatusResponse, getBanStatus } from '@/services/ban';
import { signOut } from '@/services/login';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from './SessionContext';
import { useThemeContext } from './ThemeContext';

interface BanDetails {
    reason?: string | null;
    bannedAt?: string | null;
    bannedUntil?: string | null;
}

interface BanContextValue {
    isBanned: boolean;
    banDetails: BanDetails | null;
    checkBanStatus: () => Promise<void>;
}

const BanContext = createContext<BanContextValue>({
    isBanned: false,
    banDetails: null,
    checkBanStatus: async () => { },
});

export const BanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useSession();
    const { colors, theme } = useThemeContext();
    const { t } = useTranslation();
    const [isBanned, setIsBanned] = useState(false);
    const [banDetails, setBanDetails] = useState<BanDetails | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const checkBanStatus = useCallback(async () => {
        if (!session?.user?.id) {
            setIsBanned(false);
            setBanDetails(null);
            return;
        }

        try {
            const status: BanStatusResponse = await getBanStatus();
            if (status.isBanned) {
                setIsBanned(true);
                setBanDetails({
                    reason: status.banReason,
                    bannedAt: status.bannedAt,
                    bannedUntil: status.bannedUntil,
                });
                return;
            }
        } catch (err) {
            console.warn('Failed to check user ban status:', err);
        }

        setIsBanned(false);
        setBanDetails(null);
    }, [session?.user?.id]);

    useEffect(() => {
        checkBanStatus();
    }, [checkBanStatus]);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
            setIsBanned(false);
            setBanDetails(null);
        } catch (err) {
            console.error('Error logging out banned user:', err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const isDark = theme === 'dark';
    const cardBg = colors.surfaceContainerHigh || colors.card;
    const borderCol = colors.error ? `${colors.error}40` : 'rgba(239, 68, 68, 0.3)';
    const iconBadgeBg = colors.errorContainer || (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)');
    const iconCol = colors.error || '#EF4444';
    const titleCol = colors.onSurface || colors.text;
    const descCol = colors.onSurfaceVariant || colors.muted;
    const reasonCardBg = colors.surfaceContainer || colors.containerContent;
    const reasonBorder = colors.outlineVariant || colors.divider;
    const btnBg = colors.error || '#EF4444';
    const btnTextCol = colors.onError || '#FFFFFF';

    return (
        <BanContext.Provider value={{ isBanned, banDetails, checkBanStatus }}>
            {children}

            {/* Reacticx Animated Dialog for Banned User */}
            {isBanned && (
                <Dialog open={isBanned}>
                    <Dialog.Backdrop
                        blurAmount={20}
                        blurType={isDark ? 'dark' : 'light'}
                        backgroundColor={isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)'}
                    />
                    <Dialog.Content>
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
                            <View style={[styles.iconBadge, { backgroundColor: iconBadgeBg }]}>
                                <Ionicons name="shield-outline" size={32} color={iconCol} />
                            </View>

                            <FlexText style={[styles.title, { color: titleCol }]}>
                                {t('ban.dialog.title', 'Account Suspended')}
                            </FlexText>

                            <FlexText style={[styles.description, { color: descCol }]}>
                                {t('ban.dialog.description', 'Your account has been restricted from accessing platform data.')}
                            </FlexText>

                            <View style={styles.reasonCard}>
                                <FlexText style={[styles.reasonLabel, { color: iconCol }]}>
                                    {t('ban.dialog.reasonLabel', 'Reason:')}
                                </FlexText>
                                <FlexText style={[styles.reasonText, { color: titleCol }]}>
                                    {banDetails?.reason || t('ban.toast.defaultReason', 'Violation of community guidelines')}
                                </FlexText>

                                {banDetails?.bannedAt && (
                                    <FlexText style={[styles.metaText, { color: descCol }]}>
                                        {t('ban.dialog.bannedAtLabel', 'Banned date:')}{' '}
                                        {new Date(banDetails.bannedAt).toLocaleString()}
                                    </FlexText>
                                )}

                                <FlexText style={[styles.metaText, { color: descCol }]}>
                                    {t('ban.dialog.expiresLabel', 'Expires:')}{' '}
                                    {banDetails?.bannedUntil
                                        ? new Date(banDetails.bannedUntil).toLocaleString()
                                        : t('ban.dialog.permanent', 'Permanent Ban')}
                                </FlexText>
                            </View>

                            <Pressable
                                onPress={handleLogout}
                                disabled={isLoggingOut}
                                style={({ pressed }) => [
                                    styles.logoutButton,
                                    { backgroundColor: btnBg },
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator color={btnTextCol} size="small" />
                                ) : (
                                    <Text style={[styles.logoutButtonText, { color: btnTextCol }]}>
                                        {t('ban.dialog.logoutButton', 'Log Out')}
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Dialog.Content>
                </Dialog>
            )}
        </BanContext.Provider>
    );
};

export const useBanStatus = () => useContext(BanContext);

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center'
    },
    iconBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    reasonCard: {
        width: '100%',
        borderRadius: 16,
        marginBottom: 24,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    metaText: {
        fontSize: 11,
        marginTop: 2,
    },
    logoutButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
