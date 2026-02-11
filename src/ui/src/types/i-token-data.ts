export interface IToken {
  raw: string;
  obj: any;
}

export interface ITokenData {
  accessToken: IToken | null;
  idToken: IToken | null;
  refreshToken: IToken | null;
}
