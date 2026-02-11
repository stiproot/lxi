// src/services/auth/oktaAuth.service.ts
import { OktaAuth } from '@okta/okta-auth-js';
import { jwtDecode } from 'jwt-decode';
import { EnvKeys } from '@/types/env-keys';
import { ICoreAuthService } from '@/types/i-core-auth-service';
import { IRefreshTokenCmd } from '@/types/i-refresh-token-cmd';
import { ITokenData } from '@/types/i-token-data';
import { ITokenExchangeCmd } from '@/types/i-token-exchange-cmd';
import { ITokenExchangeResp } from '@/types/i-token-exchange-resp';
import { CmdService } from '../cmd.service';
import { ENV_VAR } from '../env.service';
import { StorageService } from '../storage.service';

const REDIRECT_URI = (): string => `${window.location.origin}/authorization-code/callback`;
const LOGIN_URI = (): string => `${window.location.origin}/login`;
const OKTA_CLIENT_ID = (): string => ENV_VAR(EnvKeys.VITE_OKTA_CLIENT_ID);
const OKTA_ISSUER = (): string => ENV_VAR(EnvKeys.VITE_OKTA_ISSUER);

export class OktaAuthService implements ICoreAuthService {
  readonly _authClient: OktaAuth;
  private readonly _cmdService: CmdService = new CmdService();

  constructor() {
    this._authClient = new OktaAuth({
      clientId: OKTA_CLIENT_ID(),
      issuer: OKTA_ISSUER(),
      redirectUri: REDIRECT_URI(),
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      pkce: false,
      responseType: ['code'],
    });
  }

  public isAuthenticated(): boolean {
    const accessToken = StorageService.accessToken();
    if (!accessToken) {
      return false;
    }

    // todo: validate token...

    // Validate token expiration
    const decodedToken = jwtDecode(accessToken.raw);
    const currentTime = Date.now() / 1000;
    if (!decodedToken.exp || decodedToken.exp < currentTime) {
      return false;
    }

    return true;
  }

  public getVerificationCode(): string {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      throw new Error('No code in URL');
    }
    return code;
  }

  public getStateCode(): string {
    const code = new URLSearchParams(window.location.search).get('state');
    if (!code) {
      throw new Error('No state in URL');
    }
    return code;
  }

  public async exchangeCodeForTokens(code: string, state: string): Promise<ITokenExchangeResp> {
    const { nonce } = this.getTransactionDataFromStorage(state);
    const data: ITokenExchangeCmd = { code, nonce };
    const resp: ITokenExchangeResp = await this._cmdService.publishTokenExchangeCmd(data);
    return resp;
  }

  public async signIn(): Promise<void> {
    await this.signInWithRedirect();
  }

  private signInWithRedirect = async (): Promise<void> =>
    await this._authClient.signInWithRedirect();

  public logout(): void {
    StorageService.clearUsrData();
    this._authClient.signOut(); // Sign out from Okta
    window.location.href = LOGIN_URI();
  }

  public async refreshTokens(): Promise<void> {
    const refreshToken = StorageService.refreshToken()?.raw;

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const cmd: IRefreshTokenCmd = { refreshToken };
    const resp: ITokenData = await this._cmdService.publishRefreshTokenCmd(cmd);

    StorageService.setTokenData(resp);
  }

  private getTransactionDataFromStorage(state: string): any {
    const transactionStorage = localStorage.getItem('okta-shared-transaction-storage');
    if (!transactionStorage) {
      throw new Error('No transaction storage to use.');
    }

    const obj = JSON.parse(transactionStorage);
    const transaction = obj[state].transaction;
    const nonce = transaction.nonce;

    return { nonce };
  }
}
