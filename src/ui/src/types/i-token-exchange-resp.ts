// src/types/i-token-exchange-resp.ts
import { ITokenData } from './i-token-data';
import { IUsrData } from './i-usr-data';

export interface ITokenExchangeResp {
  tokens: ITokenData;
  usr: IUsrData;
}
