'use client';
import { useEffect, useRef } from 'react';

type ServerSessionUpdaterProps = {
  encryptedSharedSession?: string;
};

const ServerSessionUpdater = ({ encryptedSharedSession }: ServerSessionUpdaterProps) => {
  const initialized = useRef(false);

  const handleTokenRefreshInNext = async () => {
    const fetchResponse = await fetch('/api/nextjs-update-server-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encryptedSharedSession }),
    });

    if (!fetchResponse.ok) {
      console.log('Failed refreshing the token.');
    }
  };

  useEffect(() => {
    if (!encryptedSharedSession) {
      return;
    }

    if (initialized.current) {
      return;
    }

    handleTokenRefreshInNext();
    initialized.current = true;
  }, []);

  return null;
};

export default ServerSessionUpdater;
