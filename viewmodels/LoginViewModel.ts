
import { useState } from "react";
import { signInWithGoogle } from "../services/login";
import { useToast } from "heroui-native/toast";
import { useTranslation } from "react-i18next";

export const useLoginViewModel = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleGoogleLogin = async () => {
        try {
            setIsSigningIn(true);
            setError(null);
            await signInWithGoogle();
        } catch (err: any) {
            console.warn("Google login error", err);
            setError(err);
            
            const msg = err.message || String(err);
            let description = msg;
            let title = "Sign-in Error";

            if (msg.includes("NoCredentialException") || msg.includes("No Google account found")) {
                description = "No Google account found. Please add a Google account in Settings > Accounts on your device.";
            } else if (msg.toLowerCase().includes("banned") || msg.toLowerCase().includes("suspended")) {
                title = t('ban.toast.title', 'Account Banned');
                description = t('ban.toast.message', {
                    reason: err.reason || t('ban.toast.defaultReason', 'Violation of community guidelines'),
                });
            }
            
            toast.show({
                label: title,
                description: description,
                variant: "danger",
            });
        } finally {
            setIsSigningIn(false);
        }
    };

    return {
        isSigningIn,
        error,
        handleGoogleLogin,
        clearError: () => setError(null),
    };
};
