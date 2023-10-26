'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onLoginClick = async () => {
    setError('');

    const fetchResponse = await fetch('/api/nextjs-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      setError(error.message);
      return;
    }

    router.push('/protected-rsc');
  };

  return (
    <div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={onLoginClick}>Login</button>
      {!!error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default Login;
