import { EnvKeys } from '@/types/env-keys';
import { IRefreshTokenCmd } from '@/types/i-refresh-token-cmd';
import { ITokenData } from '@/types/i-token-data';
import { ITokenExchangeCmd } from '@/types/i-token-exchange-cmd';
import { ENV_VAR } from './env.service';
import { StorageService } from './storage.service';

const DEFAULT_BASE_URL = () => ENV_VAR(EnvKeys.VITE_UI_API_BASE_URL);

export class AuthHttpClient {
  private readonly BASE_URL: string;

  constructor() {
    this.BASE_URL = DEFAULT_BASE_URL();
  }

  public async exchangeCodeForTokens(cmd: ITokenExchangeCmd) {
    const url = `${this.BASE_URL}/api/auth/token/exchange`;
    const req = {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
      },
      body: JSON.stringify(cmd),
    };

    const response = await fetch(url, req);
    if (!response.ok) {
      throw new Error(`[EXCHANGE] POST request to ${url} failed with status ${response.status}`);
    }

    return await response.json();
  }

  public async refreshTokens() {
    const token = StorageService.refreshToken()?.raw;
    if (!token) {
      throw Error('No refresh token');
    }
    const cmd: IRefreshTokenCmd = {
      refreshToken: token,
    };

    const url = `${this.BASE_URL}/api/auth/token/refresh`;
    const req = {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
      },
      body: JSON.stringify(cmd),
    };

    try {
      const response = await fetch(url, req);
      if (!response.ok) {
        throw new Error(`[REFRESH] POST request to ${url} failed with status ${response.status}`);
      }

      const tokens = await response.json();
      StorageService.setTokenData(tokens as ITokenData);
    } catch (error) {
      StorageService.clearUsrData();
      window.location.href = `${window.location.origin}/login`;
    }
  }

  private buildHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    return headers;
  }
}
