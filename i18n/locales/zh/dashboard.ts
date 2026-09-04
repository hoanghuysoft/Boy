const dashboard = {
    sections: {
        services: '服务',
        entertainment: '娱乐',
    },
    services: {
        reclip: 'ReClip',
        weloveAdmin: 'WeLove 管理员',
        bulletin: '公告栏',
        notes: '便签',
        music: '音乐',
        movies: '电影',
    },
    weather: {
        title: '天气',
        refresh: '刷新',
        refreshing: '正在刷新...',
        fetching: '获取中...',
        unavailable: '暂无天气数据。',
        wind: '风速 {{speed}} km/h',
        updated: '更新于 {{time}}',
    },
} as const;

export default dashboard;
