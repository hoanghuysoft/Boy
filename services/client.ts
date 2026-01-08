import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';
import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from './login';

onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});

const storage = createMMKV();

export const clientPersister: Persister = {
    persistClient: async (client) => {
        storage.set('REACT_QUERY_OFFLINE_CACHE', JSON.stringify(client));
    },
    restoreClient: async () => {
        const client = storage.getString('REACT_QUERY_OFFLINE_CACHE');
        return client ? JSON.parse(client) : undefined;
    },
    removeClient: async () => {
        storage.remove('REACT_QUERY_OFFLINE_CACHE');
    },
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            networkMode: 'offlineFirst',
        },
        mutations: {
            networkMode: 'offlineFirst',
        },
    },
});

export const client = axios.create({
    baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});