import { ITokenExchangeResp } from '@/types/i-token-exchange-resp';

export interface ICoreAuthService {
  isAuthenticated: () => boolean;
  logout: () => void;
  getVerificationCode: () => string;
  getStateCode: () => string;
  exchangeCodeForTokens: (code: string, state: string) => Promise<ITokenExchangeResp>;
  signIn: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}
