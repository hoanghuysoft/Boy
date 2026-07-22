const ban = {
    toast: {
        title: '账号已被封禁',
        message: '您的账号已被暂停使用。原因：{{reason}}',
        defaultReason: '违反平台社区准则',
    },
    dialog: {
        title: '账号已被封禁',
        description: '您的账号已被限制访问平台数据。',
        reasonLabel: '原因：',
        bannedAtLabel: '封禁时间：',
        expiresLabel: '到期时间：',
        permanent: '永久封禁',
        logoutButton: '退出登录',
    },
} as const;

export default ban;
