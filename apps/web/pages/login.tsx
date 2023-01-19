import { useCallback, useEffect, useState } from 'react';
import useUser from '@lib/hooks/useUser';
import Layout from 'layouts';
import fetchJson from '@lib/fetch';
import Router from 'next/router';

export const redirectURI = encodeURIComponent(`http://localhost:3000/login`);
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&permissions=8&redirect_uri=${redirectURI}&response_type=code&scope=identify%20guilds`;
export default function Login() {
  const [errorMessage, setErrorMessage] = useState('');

  // Check if user is logged in
  const { user, mutateUser } = useUser({
    redirectTo: '/dashboard',
    redirectIfFound: true,
  });

  const handleAuthCode = useCallback(
    async function handleAuthCode() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      window.history.replaceState({}, document.title, '/login'); // remove code from url

      if (code && !user?.isLoggedIn) {
        try {
          mutateUser(
            await fetchJson('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code,
              }),
            }),
            false,
          );
          Router.push('/dashboard');
        } catch (error) {
          console.log(error);
        }
      }
    },
    [user, mutateUser],
  );

  useEffect(() => {
    if (!user?.isLoggedIn) {
      handleAuthCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div>
        <h1>Login</h1>
        <a rel="noreferrer nofollow" href={DISCORD_AUTH_URL}>
          Login on discord
        </a>

        <div>
          <p>{user?.username}</p>
          <p>{user?.accessToken}</p>
        </div>
      </div>
    </Layout>
  );
}
