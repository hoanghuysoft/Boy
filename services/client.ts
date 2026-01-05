import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { supabase } from './login';

export const queryClient = new QueryClient();

export const client = axios.create({
    baseURL: 'https://boy-server.vercel.app',
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

// apifyClient removed to avoid Node.js dependency issues in React Native