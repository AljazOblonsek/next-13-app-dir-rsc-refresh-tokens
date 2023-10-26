import { AuthTokens, Session } from './types';
import jwtDecode from 'jwt-decode';
import { encryptSharedSession } from './utils';

type RefreshTokensReturn = {
  accessToken: string;
  refreshToken: string;
  encryptedSharedSession: string;
};

const refreshTokens = async (data: AuthTokens): Promise<RefreshTokensReturn | null> => {
  const fetchResponse = await fetch('http://localhost:8000/express-api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!fetchResponse.ok) {
    return null;
  }

  const response = await fetchResponse.json();

  const accessTokenPayload = jwtDecode<any>(response.accessToken);

  const session: Session = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: accessTokenPayload.user,
  };

  const encryptedSharedSession = encryptSharedSession(session);

  return { ...response, encryptedSharedSession };
};

interface ServerFetchRequestInit extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export const serverFetch = async ({
  input,
  init,
  authTokens,
}: {
  input: RequestInfo;
  init?: ServerFetchRequestInit;
  authTokens?: AuthTokens;
}): Promise<{
  response: Response;
  encryptedSharedSession?: string;
}> => {
  try {
    let headers: Record<string, string> = {};

    if (init && init.headers) {
      headers = { ...init.headers };
    }

    const response = await fetch(input, { ...init, ...headers });

    if (response.status !== 401) {
      return { response };
    }

    if (input.toString().includes('login')) {
      return { response };
    }

    if (!authTokens) {
      return { response };
    }

    const refreshTokensResponse = await refreshTokens(authTokens);

    if (!refreshTokensResponse) {
      return { response };
    }

    headers.authorization = `Bearer ${refreshTokensResponse.accessToken}`;

    const newResponse = await fetch(input, { ...init, headers });

    if (newResponse.status === 401) {
      return { response: newResponse };
    }

    return {
      response: newResponse,
      encryptedSharedSession: refreshTokensResponse.encryptedSharedSession,
    };
  } catch (error: unknown) {
    console.log('An unknown error occurred: ', String(error));
    throw error;
  }
};
