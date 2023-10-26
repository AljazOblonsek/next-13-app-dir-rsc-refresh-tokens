export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
  };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: String;
};
