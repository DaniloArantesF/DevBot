'use client';
import Button from '@components/Button';
import { fetchAuth } from '@lib/hooks/useAuth';
import classes from '@styles/Login.module.css';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { getCookie, setCookie } from 'cookies-next';

const redirectURI = encodeURIComponent(`${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost'}/login`);
const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&redirect_uri=${redirectURI}&response_type=code&scope=identify%20connections%20guilds`;

function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const processing = useRef(false);
  const isClient = typeof window !== 'undefined';
  const isLogged = useMemo(() => (isClient ? !!getCookie('accessToken') : false), [isClient]);

  useEffect(() => {
    if (isLogged && processing.current) {
      redirectUser();
    }
    if (isClient && !isLogged) {
      const code = params.get('code');
      if (code) {
        login(code);
      }
    }

    return () => {
      processing.current = true; // keep login/redirect from firing again
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function redirectUser() {
    router.replace('/dashboard');
    router.refresh();
  }

  async function login(code: string) {
    if (processing.current) return;
    try {
      const authData = await fetchAuth(code);
      if (authData) {
        setCookie('accessToken', authData.accessToken);
        setCookie('refreshToken', authData.refreshToken);

        redirectUser();
      }
    } catch (error) {
      console.log('error processing data', error);
    }
  }

  return (
    <div className={classes.container}>
      <section className={classes.body}>
        <Button label={'Discord Login'} href={DISCORD_AUTH_URL} />
        {/* <Widget title="Login" style={{ maxWidth: '300px' }}>
        </Widget> */}
      </section>
    </div>
  );
}

export default Page;
