import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { createProfile, uploadAvatar } from '../services/onboarding';

export interface OnboardingForm {
    name: string;
    birthday: Date | null;
    bio: string;
    avatarUri: string | null;
}

export interface OnboardingViewModel {
    form: OnboardingForm;
    isSubmitting: boolean;
    error: string | null;
    maxBirthday: Date;
    setField: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
    pickAvatar: () => Promise<void>;
    handleSubmit: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAtLeast18(date: Date): boolean {
    const threshold = new Date(
        date.getFullYear() + 18,
        date.getMonth(),
        date.getDate()
    );
    return new Date() >= threshold;
}

function toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOnboardingViewModel = (): OnboardingViewModel => {
    const router = useRouter();

    // Latest selectable birthday — must be 18 years ago or earlier.
    const maxBirthday = new Date();
    maxBirthday.setFullYear(maxBirthday.getFullYear() - 18);

    const [form, setForm] = useState<OnboardingForm>({
        name: '',
        birthday: null,
        bio: '',
        avatarUri: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setField = <K extends keyof OnboardingForm>(
        key: K,
        value: OnboardingForm[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setError('Permission to access photos is required.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setField('avatarUri', result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        setError(null);

        const name = form.name.trim();
        if (!name) {
            setError('Please enter your name.');
            return;
        }

        if (!form.birthday) {
            setError('Please select your date of birth.');
            return;
        }

        if (!isAtLeast18(form.birthday)) {
            setError('You must be at least 18 years old.');
            return;
        }

        setIsSubmitting(true);
        try {
            const profile = await createProfile({
                name,
                birthday: toIsoDate(form.birthday),
                bio: form.bio.trim() || null,
            });

            if (form.avatarUri) {
                // Best-effort — avatar failure must not block the user.
                await uploadAvatar(profile.id, form.avatarUri).catch(() => { });
            }

            router.replace('/');
        } catch (err: any) {
            setError(err?.message ?? 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return { form, isSubmitting, error, maxBirthday, setField, pickAvatar, handleSubmit };
};
