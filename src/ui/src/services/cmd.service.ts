import { IRefreshTokenCmd } from '@/types/i-refresh-token-cmd';
import { ITokenData } from '@/types/i-token-data';
import { ITokenExchangeCmd } from '@/types/i-token-exchange-cmd';
import { ITokenExchangeResp } from '@/types/i-token-exchange-resp';
import { AuthHttpClient } from './auth-http.client';
import { HttpClient } from './http.client';

export class CmdService {
  private readonly _client = new HttpClient();
  private readonly _authClient = new AuthHttpClient();

  private async sendRequest(
    method: 'post' | 'patch',
    endpoint: string,
    cmdData: any = {}
  ): Promise<any> {
    try {
      return await this._client[method](endpoint, { cmdData });
    } catch (error) {
      console.error(`${method.toUpperCase()} request to ${endpoint} failed:`, error);
      return method === 'post' ? [] : {};
    }
  }

  public async publishTokenExchangeCmd(cmd: ITokenExchangeCmd): Promise<ITokenExchangeResp> {
    return this._authClient.exchangeCodeForTokens(cmd);
  }

  public async publishRefreshTokenCmd(cmd: IRefreshTokenCmd): Promise<ITokenData> {
    return this.sendRequest('post', '/Auth/token/refresh', cmd);
  }
}
