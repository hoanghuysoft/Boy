const ban = {
    toast: {
        title: 'Account Banned',
        message: 'Your account has been suspended. Reason: {{reason}}',
        defaultReason: 'Violation of community guidelines',
    },
    dialog: {
        title: 'Account Suspended',
        description: 'Your account has been restricted from accessing platform data.',
        reasonLabel: 'Reason:',
        bannedAtLabel: 'Banned date:',
        expiresLabel: 'Expires:',
        permanent: 'Permanent Ban',
        logoutButton: 'Log Out',
    },
} as const;

export default ban;
