import axios, { AxiosInstance } from 'axios';
import { EnvKeys } from '@/types/env-keys';
import { AuthHttpClient } from './auth-http.client';
import { ENV_VAR } from './env.service';
import { StorageService } from './storage.service';

const DEFAULT_BASE_URL = () => ENV_VAR(EnvKeys.VITE_UI_API_BASE_URL);

let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

export class HttpClient {
  private readonly BASE_URL: string;
  private readonly _client: AxiosInstance;
  private readonly _refreshClient: AuthHttpClient;

  constructor(baseUrl: string | null = null) {
    this.BASE_URL = baseUrl || DEFAULT_BASE_URL();
    this._refreshClient = new AuthHttpClient();
    this._client = axios.create({ baseURL: this.BASE_URL });

    this._client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          if (StorageService.isTokenRefreshing()) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return axios(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          StorageService.isTokenRefreshing(true);

          try {
            await this._refreshClient.refreshTokens();
            processQueue(null);
            StorageService.isTokenRefreshing(false);
            return this._client(originalRequest);
          } catch (err) {
            processQueue(err);
            StorageService.isTokenRefreshing(false);
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async request(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: any,
    headers = {},
    signal?: AbortSignal // Add signal parameter
  ) {
    try {
      const response = await this._client.request({
        method,
        url: path,
        data,
        headers: { ...this.buildHeaders(), ...headers },
        signal, // Pass signal to Axios request configuration
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(`Error in ${method}:`, error.message);
        if (error.response) {
          console.error(`Response status: ${error.response.status}`);
        }
      } else {
        console.error(`Error in ${method}:`, error);
      }
      throw error;
    }
  }

  public get<T>(path: string, headers = {}, signal?: AbortSignal): Promise<T> {
    return this.request('get', path, undefined, headers, signal);
  }

  public post<T>(path: string, data: any = {}, headers = {}, signal?: AbortSignal): Promise<T> {
    return this.request('post', path, data, headers, signal);
  }

  public put<T>(path: string, data: any, headers = {}, signal?: AbortSignal): Promise<T> {
    return this.request('put', path, data, headers, signal);
  }

  public patch<T>(path: string, data: any, headers = {}, signal?: AbortSignal): Promise<T> {
    return this.request('patch', path, data, headers, signal);
  }

  public delete<T>(path: string, headers = {}, signal?: AbortSignal): Promise<T> {
    return this.request('delete', path, undefined, headers, signal);
  }

  private buildHeaders() {
    let headers = { 'Content-Type': 'application/json' };
    const token = StorageService.accessToken()?.raw;

    if (token) {
      headers = Object.assign(headers, { Authorization: `Bearer ${token}` });
    }

    return headers;
  }
}
