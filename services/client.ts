import NetInfo from "@react-native-community/netinfo";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import type { Persister } from "@tanstack/react-query-persist-client";
import ky, { KyInstance, Options } from "ky";
import { createMMKV } from "react-native-mmkv";
import { supabase } from "./login";

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const storage = createMMKV();

export const clientPersister: Persister = {
  persistClient: async (client) => {
    storage.set("REACT_QUERY_OFFLINE_CACHE", JSON.stringify(client));
  },
  restoreClient: async () => {
    const client = storage.getString("REACT_QUERY_OFFLINE_CACHE");
    return client ? JSON.parse(client) : undefined;
  },
  removeClient: async () => {
    storage.remove("REACT_QUERY_OFFLINE_CACHE");
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// ============================================================================
// Axios-to-Ky Wrapper
// ============================================================================

interface KyConfig extends Omit<Options, "searchParams"> {
  params?: Record<string, any>;
}

/**
 * Wraps a Ky instance to behave like Axios so we don't have to refactor the entire app.
 * - Strips leading slashes (Ky's prefixUrl doesn't like them)
 * - Maps `params` to `searchParams`
 * - Extracts JSON and returns it as `{ data }`
 */
const createKyClient = (baseKy: KyInstance) => {
  const mapConfig = (config?: KyConfig): Options => {
    if (!config) return {};
    const { params, ...rest } = config;
    return {
      ...rest,
      // Convert standard object to Ky's searchParams
      ...(params ? { searchParams: params } : {}),
    };
  };

  return {
    get: async <T = any>(url: string, config?: KyConfig) => {
      const data = await baseKy.get(url, mapConfig(config)).json<T>();
      return { data };
    },
    post: async <T = any>(url: string, payload?: any, config?: KyConfig) => {
      const data = await baseKy
        .post(url, { ...mapConfig(config), json: payload })
        .json<T>();
      return { data };
    },
    put: async <T = any>(url: string, payload?: any, config?: KyConfig) => {
      const data = await baseKy
        .put(url, { ...mapConfig(config), json: payload })
        .json<T>();
      return { data };
    },
    delete: async <T = any>(url: string, config?: KyConfig) => {
      const data = await baseKy.delete(url, mapConfig(config)).json<T>();
      return { data };
    },
    patch: async <T = any>(url: string, payload?: any, config?: KyConfig) => {
      const data = await baseKy
        .patch(url, { ...mapConfig(config), json: payload })
        .json<T>();
      return { data };
    },
    // Expose the raw ky instance in case you need advanced Ky features later
    ky: baseKy,
  };
};

// ============================================================================
// Client Instances
// ============================================================================

const baseClient = ky.create({
  prefix: process.env.EXPO_PUBLIC_SERVER_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

const baseShowsClient = ky.create({
  prefix: process.env.EXPO_PUBLIC_SHOWS_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

export const client = createKyClient(baseClient);
export const showsClient = createKyClient(baseShowsClient);

// ─── TMDB Client ──────────────────────────────────────────────────────────────

const baseTmdbClient = ky.create({
  prefix: 'https://api.themoviedb.org/3/',
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_TMDB_API_KEY || ''}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const tmdbClient = createKyClient(baseTmdbClient);

