const themeSettings = {
    title: 'Theme',
    subtitle: 'Choose how the app looks',
    options: {
        light:    { label: 'Light',    description: 'Always use light theme' },
        dark:     { label: 'Dark',     description: 'Always use dark theme' },
        system:   { label: 'System',   description: 'Follow device settings' },
        adaptive: { label: 'Adaptive', description: 'Change theme based on sunset and sunrise' },
    },
} as const;

export default themeSettings;
