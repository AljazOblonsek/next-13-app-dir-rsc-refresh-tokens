import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import { Session } from './types';

const SERVER_SESSION_ENCRYPTION_SECRET = 'super_secret_key_for_server_session_encryption';

export const encryptServerSession = (session: Session): string => {
  const encryptedSession = AES.encrypt(
    JSON.stringify(session),
    SERVER_SESSION_ENCRYPTION_SECRET
  ).toString();

  return encryptedSession;
};

export const decryptServerSession = (encryptedValue: string): Session | null => {
  try {
    const bytes = AES.decrypt(encryptedValue, SERVER_SESSION_ENCRYPTION_SECRET);
    const decryptedSession = JSON.parse(bytes.toString(encUtf8)) as Session;

    return decryptedSession;
  } catch {
    return null;
  }
};

const SHARED_SESSION_ENCRYPTION_SECRET = 'super_secret_key_for_shared_session_encryption';

export const encryptSharedSession = (session: Session): string => {
  const encryptedSession = AES.encrypt(
    JSON.stringify(session),
    SHARED_SESSION_ENCRYPTION_SECRET
  ).toString();

  return encryptedSession;
};

export const decryptSharedSession = (encryptedValue: string): Session | null => {
  try {
    const bytes = AES.decrypt(encryptedValue, SHARED_SESSION_ENCRYPTION_SECRET);
    const decryptedSession = JSON.parse(bytes.toString(encUtf8)) as Session;

    return decryptedSession;
  } catch {
    return null;
  }
};
