import NetInfo from "@react-native-community/netinfo";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import type { Persister } from "@tanstack/react-query-persist-client";
import { fetch as nitroFetch } from "react-native-nitro-fetch";
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
// Nitro Fetch Client Wrapper
// ============================================================================

interface ClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

type RequestInterceptor = (config: {
  url: string;
  headers: Record<string, string>;
}) => Promise<{ url: string; headers: Record<string, string> }>;

interface NitroClient {
  get: <T = any>(url: string, config?: RequestConfig) => Promise<{ data: T }>;
  post: <T = any>(url: string, body?: any, config?: RequestConfig) => Promise<{ data: T }>;
  put: <T = any>(url: string, body?: any, config?: RequestConfig) => Promise<{ data: T }>;
  patch: <T = any>(url: string, body?: any, config?: RequestConfig) => Promise<{ data: T }>;
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<{ data: T }>;
  interceptors: {
    request: { use: (fn: RequestInterceptor) => void };
  };
}

function buildUrl(baseURL: string, path: string, params?: Record<string, any>): string {
  const base = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;

  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  return url;
}

function createClient(config: ClientConfig): NitroClient {
  const defaultHeaders: Record<string, string> = { ...config.headers };
  const requestInterceptors: RequestInterceptor[] = [];

  async function request<T>(
    method: string,
    url: string,
    body?: any,
    reqConfig?: RequestConfig,
  ): Promise<{ data: T }> {
    const fullUrl = buildUrl(config.baseURL, url, reqConfig?.params);
    let headers: Record<string, string> = {
      ...defaultHeaders,
      ...reqConfig?.headers,
    };

    let ctx = { url: fullUrl, headers };
    for (const interceptor of requestInterceptors) {
      ctx = await interceptor(ctx);
    }
    headers = ctx.headers;

    const isFormData = body instanceof FormData;
    const fetchInit: RequestInit = {
      method,
      headers: isFormData
        ? (({ "Content-Type": _, ...rest }) => rest)(headers)
        : headers,
    };

    if (body !== undefined) {
      fetchInit.body = isFormData ? body : JSON.stringify(body);
    }

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (config.timeout) {
      timeoutId = setTimeout(() => controller.abort(), config.timeout);
      fetchInit.signal = controller.signal;
    }

    try {
      const response = await nitroFetch(ctx.url, fetchInit);
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new NitroClientError(
          `Request failed with status ${response.status}`,
          response.status,
          errorBody,
          method,
          ctx.url,
        );
      }
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return { data };
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  return {
    get: <T = any>(url: string, config?: RequestConfig) =>
      request<T>("GET", url, undefined, config),
    post: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>("POST", url, body, config),
    put: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>("PUT", url, body, config),
    patch: <T = any>(url: string, body?: any, config?: RequestConfig) =>
      request<T>("PATCH", url, body, config),
    delete: <T = any>(url: string, config?: RequestConfig) =>
      request<T>("DELETE", url, undefined, config),
    interceptors: {
      request: {
        use: (fn: RequestInterceptor) => {
          requestInterceptors.push(fn);
        },
      },
    },
  };
}

export class NitroClientError extends Error {
  status: number;
  responseBody: string;
  method: string;
  url: string;

  constructor(message: string, status: number, responseBody: string, method: string, url: string) {
    super(message);
    this.name = "NitroClientError";
    this.status = status;
    this.responseBody = responseBody;
    this.method = method;
    this.url = url;
  }
}

// ============================================================================
// Client Instances
// ============================================================================

export const client = createClient({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async ({ url, headers }) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return { url, headers };
});

export const showsClient = createClient({
  baseURL: process.env.EXPO_PUBLIC_SHOWS_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── TMDB Client ──────────────────────────────────────────────────────────────

export const tmdbClient = createClient({
  baseURL: "https://api.themoviedb.org/3/",
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_TMDB_API_KEY || ""}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
