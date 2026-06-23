export interface IAvatar {
    id: number;
    name: string;
    url: string;
    background: string | null;
}

export const avatar: IAvatar[] = [
    {
        id: 0,
        name: "Default",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Google_Vids_Logo_05.2026.svg/3840px-Google_Vids_Logo_05.2026.svg.png",
        background: 'white'
    },
    {
        id: 1,
        name: "Gayerdar",
        url: "https://images.gayerdar.com/assets/images/brands/gayerdar/favicon.ico",
        background: null
    },
    {
        id: 2,
        name: "ducal",
        url: "https://pbs.twimg.com/media/GJLDxcWbEAAH0lD?format=jpg&name=small",
        background: null
    }
]