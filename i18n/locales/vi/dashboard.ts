const dashboard = {
    sections: {
        services: 'Dịch vụ',
        entertainment: 'Rạp phim CGV',
    },
    services: {
        reclip: 'ReClip',
        weloveAdmin: 'Quản trị WeLove',
        bulletin: 'Bảng tin',
        notes: 'Ghi chú',
        music: 'Âm nhạc',
        movies: 'Phim',
    },
    weather: {
        title: 'Thời tiết',
        refresh: 'Làm mới',
        refreshing: 'Đang làm mới...',
        fetching: 'Đang tải...',
        unavailable: 'Dữ liệu thời tiết sẽ sớm có.',
        wind: 'Gió {{speed}} km/h',
        updated: 'Cập nhật lúc {{time}}',
    },
} as const;

export default dashboard;
