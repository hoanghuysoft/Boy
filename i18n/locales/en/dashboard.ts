const dashboard = {
    sections: {
        services: 'Services',
        entertainment: 'Entertainment',
    },
    services: {
        reclip: 'ReClip',
        weloveAdmin: 'WeLove Admin',
        bulletin: 'Bulletin',
        notes: 'Notes',
        music: 'Music',
        movies: 'Movies',
    },
    weather: {
        title: 'Weather',
        refresh: 'Refresh',
        refreshing: 'Refreshing...',
        fetching: 'Fetching...',
        unavailable: 'Weather data will be available soon.',
        wind: 'Wind {{speed}} km/h',
        updated: 'Updated {{time}}',
    },
} as const;

export default dashboard;
