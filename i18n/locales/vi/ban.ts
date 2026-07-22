const ban = {
    toast: {
        title: 'Tài khoản bị khóa',
        message: 'Tài khoản của bạn đã bị khóa. Lý do: {{reason}}',
        defaultReason: 'Vi phạm quy định nền tảng',
    },
    dialog: {
        title: 'Tài Khoản Đã Bị Khóa',
        description: 'Tài khoản của bạn đã bị hạn chế truy cập dữ liệu trên hệ thống.',
        reasonLabel: 'Lý do:',
        bannedAtLabel: 'Ngày bị khóa:',
        expiresLabel: 'Thời hạn:',
        permanent: 'Vĩnh viễn',
        logoutButton: 'Đăng xuất',
    },
} as const;

export default ban;
