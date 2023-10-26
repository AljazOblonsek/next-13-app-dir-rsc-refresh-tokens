import jwtDecode from 'jwt-decode';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSharedSession, encryptServerSession } from '@/app/utils';

export const POST = async (request: NextRequest) => {
  let data;

  try {
    data = await request.json();

    const sharedSession = decryptSharedSession(data.encryptedSharedSession);

    if (!sharedSession) {
      return NextResponse.json(
        { message: 'An error occurred while trying to decrypt provided session data.' },
        { status: 400 }
      );
    }

    const refreshTokenPayload = jwtDecode<any>(sharedSession.refreshToken);

    // Here we could also verify that the session has correct data before getting it ready for the server
    const encryptedServerSession = encryptServerSession(sharedSession);

    cookies().set({
      name: 'session',
      value: encryptedServerSession,
      httpOnly: true,
      expires: new Date(refreshTokenPayload.exp * 1000),
      sameSite: 'lax',
      secure: true,
    });

    return NextResponse.json(sharedSession, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
  }
};
