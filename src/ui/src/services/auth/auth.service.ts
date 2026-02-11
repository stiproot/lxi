import { jwtDecode } from 'jwt-decode';
import { ICoreAuthService } from '@/types/i-core-auth-service';
import { IToken } from '@/types/i-token-data';
import { IUsrData } from '@/types/i-usr-data';
import { EventEmitter } from '../eventEmitter';
import { StorageKeys, StorageService } from '../storage.service';
import { OktaAuthService } from './oktaAuth.service';

export const authEvents = new EventEmitter();

export class AuthService {
  private readonly _core: ICoreAuthService = new OktaAuthService();

  public isAuthenticated = (): boolean => this._core.isAuthenticated();

  public signIn = async (): Promise<void> => await this._core.signIn();

  public getUser = (): IUsrData | null => StorageService.usrData();

  public getAccessToken = (): IToken | null => StorageService.accessToken();

  public async login(): Promise<void> {
    const code = this._core.getVerificationCode();
    const state = this._core.getStateCode();
    const tokens = await this._core.exchangeCodeForTokens(code, state);
    StorageService.item(StorageKeys.LEXI_TOKEN_DATA_KEY, tokens.tokens);
    StorageService.item(StorageKeys.LEXI_USR_DATA_KEY, tokens.usr);

    // Emit login event
    authEvents.emit('login');
  }

  public logout = (): void => this._core.logout();

  public async refreshTokens(): Promise<void> {
    await this._core.refreshTokens();
  }

  public async ensureTokensAreValid(): Promise<void> {
    const accessToken = StorageService.accessToken();
    if (!accessToken) {
      this.logout();
      return;
    }

    const decodedToken = jwtDecode(accessToken.raw);
    const currentTime = Date.now() / 1000;

    // Refresh token if it is about to expire in the next 5 minutes
    if (decodedToken.exp && decodedToken.exp < currentTime + 300) {
      try {
        await this.refreshTokens();
      } catch (error) {
        this.logout();
      }
    }
  }
}
