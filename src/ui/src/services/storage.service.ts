// src/services/storage.service.ts
import { IToken, ITokenData } from '@/types/i-token-data';
import { IUsrData } from '@/types/i-usr-data';

export class StorageKeys {
  public static LEXI_USR_DATA_KEY: string = 'lxi-usr-data-storage';
  public static LEXI_TOKEN_DATA_KEY: string = 'lxi-token-data-storage';
  public static LEXI_TOKEN_REFRESHING: string = 'projectm-token-refreshing';
}

export class StorageService {
  private static serialize(obj: object | string | boolean): string {
    return JSON.stringify(obj);
  }

  private static deserialize<T>(obj: string): T {
    return JSON.parse(obj) as T;
  }

  private static get<T>(key: string): T | null {
    const val = localStorage.getItem(key);
    if (val === null) {
      return null;
    }
    return this.deserialize<T>(val);
  }

  private static set(key: string, val: object | string | boolean): void {
    if (val === null) {
      throw new Error('Value cannot be null');
    }
    const serializedVal = this.serialize(val);
    localStorage.setItem(key, serializedVal);
  }

  public static remove(key: string): void {
    localStorage.removeItem(key);
  }

  public static item<T>(key: string, val?: object | string | boolean | null): T | null {
    if (val !== undefined && val !== null) {
      this.set(key, val);
      return null;
    } else if (val === null) {
      this.remove(key);
      return null;
    }
    return this.get<T>(key);
  }

  public static tokenData(): ITokenData {
    const tokens = StorageService.item<ITokenData>(StorageKeys.LEXI_TOKEN_DATA_KEY);
    if (!tokens) {
      return { accessToken: null, idToken: null, refreshToken: null } as ITokenData;
    }
    return tokens;
  }

  public static setTokenData(tokens: ITokenData): void {
    StorageService.item(StorageKeys.LEXI_TOKEN_DATA_KEY, tokens);
  }

  public static clearUsrData(): void {
    StorageService.item(StorageKeys.LEXI_TOKEN_DATA_KEY, null);
    StorageService.item(StorageKeys.LEXI_USR_DATA_KEY, null);
    StorageService.item(StorageKeys.LEXI_TOKEN_REFRESHING, null);
  }

  public static accessToken(): IToken | null {
    const tokens = this.tokenData();
    return tokens.accessToken;
  }

  public static refreshToken(): IToken | null {
    const tokens = this.tokenData();
    return tokens.refreshToken;
  }

  public static usrData(): IUsrData {
    const usr = StorageService.item<IUsrData>(StorageKeys.LEXI_USR_DATA_KEY);
    if (!usr) {
      return { email: '', name: '' } as IUsrData;
    }
    return usr;
  }

  public static usrId(): string {
    const usr = this.usrData();
    return usr.email;
  }

  public static usrName(): string {
    const usr = this.usrData();
    return usr.name;
  }

  public static isTokenRefreshing(bit: boolean | null = null): boolean | null {
    if (bit !== null) {
      StorageService.item(StorageKeys.LEXI_TOKEN_REFRESHING, bit);
      return null;
    }

    const data = StorageService.item<boolean>(StorageKeys.LEXI_TOKEN_REFRESHING);
    return data || false;
  }
}
