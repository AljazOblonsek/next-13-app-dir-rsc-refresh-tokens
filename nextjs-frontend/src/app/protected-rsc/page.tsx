import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ServerSessionUpdater from '../components/ServerSessionUpdater';
import { serverFetch } from '../serverFetch';
import { decryptServerSession } from '../utils';

const ProtectedRSC = async () => {
  const sessionCookie = cookies().get('session');

  if (!sessionCookie) {
    // User is not authenticated
    return redirect('/login');
  }

  const serverSession = decryptServerSession(sessionCookie.value);

  if (!serverSession) {
    // Redirect user if decryption failed
    return redirect('/login');
  }

  const { response, encryptedSharedSession } = await serverFetch({
    input: 'http://localhost:8000/express-api/protected-route',
    init: {
      method: 'GET',
      headers: {
        // We could omit setting authorization header here beacause `authTokens` are passed into the `serverFetch` and could set the header depending if `authTokens` are passed or not
        authorization: `Bearer ${serverSession.accessToken}`,
      },
    },
    authTokens: {
      accessToken: serverSession.accessToken,
      refreshToken: serverSession.refreshToken,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // The token refresh process has failed
      return redirect('/login');
    }
  }

  const data = await response.json();

  return (
    <>
      <ServerSessionUpdater encryptedSharedSession={encryptedSharedSession} />
      <main>
        <h1>Proctected Server Page</h1>
        <div>Fetched data from express api: {JSON.stringify(data)}</div>
      </main>
    </>
  );
};

export default ProtectedRSC;
