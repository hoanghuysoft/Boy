const ban = {
    toast: {
        title: '帳號已被封禁',
        message: '您的帳號已被暫停使用。原因：{{reason}}',
        defaultReason: '違反平台社區準則',
    },
    dialog: {
        title: '帳號已被封禁',
        description: '您的帳號已被限制存取平台資料。',
        reasonLabel: '原因：',
        bannedAtLabel: '封禁時間：',
        expiresLabel: '到期時間：',
        permanent: '永久封禁',
        logoutButton: '登出',
    },
} as const;

export default ban;
