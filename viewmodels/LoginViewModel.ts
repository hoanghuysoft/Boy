
import { useState } from "react";
import { signInWithGoogle } from "../services/login";

export const useLoginViewModel = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleGoogleLogin = async () => {
        try {
            setIsSigningIn(true);
            setError(null);
            await signInWithGoogle();
        } catch (err: any) {
            console.warn("Google login error", err);
            setError(err);
        } finally {
            setIsSigningIn(false);
        }
    };

    return {
        isSigningIn,
        error,
        handleGoogleLogin,
    };
};
