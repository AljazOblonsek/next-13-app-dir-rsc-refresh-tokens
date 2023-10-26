import jwtDecode from 'jwt-decode';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Session } from '@/app/types';
import { encryptServerSession } from '@/app/utils';

export const POST = async (request: NextRequest) => {
  let data;

  try {
    data = await request.json();

    const fetchResponse = await fetch('http://localhost:8000/express-api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      return NextResponse.json({ message: error.message }, { status: fetchResponse.status });
    }

    const response = await fetchResponse.json();

    const accessTokenPayload = jwtDecode<any>(response.accessToken);
    const refreshTokenPayload = jwtDecode<any>(response.refreshToken);

    const session: Session = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: accessTokenPayload.user,
    };

    const encryptedServerSession = encryptServerSession(session);

    cookies().set({
      name: 'session',
      value: encryptedServerSession,
      httpOnly: true,
      expires: new Date(refreshTokenPayload.exp * 1000),
      sameSite: 'lax',
      secure: true,
    });

    return NextResponse.json(session, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
  }
};
