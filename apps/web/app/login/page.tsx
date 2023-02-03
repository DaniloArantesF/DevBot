'use client';
import Button from '@components/Button';
import fetchJson from '@lib/fetch';
import { fetchAuth } from '@lib/hooks/useAuth';
import { UserData } from 'shared/types';
import classes from '@styles/Login.module.css';
import { DISCORD_AUTH_URL } from 'shared/config';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [isLogged, setLogged] = useState(false);

  useEffect(() => {
    if (searchParams.get('code') && !isLogged) {
      const code = searchParams.get('code');
      router.replace('/login');
      setCode(code);
    }

    if (typeof window !== 'undefined' && localStorage.getItem('isLogged') === 'true') {
      setLogged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (code && !isLogged) {
      login();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function login() {
    if (!code || typeof window === 'undefined') return;
    try {
      const authData = await fetchAuth(code);
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('expiresAt', authData.expiresAt.toString());
      localStorage.setItem('isLogged', 'true');
      setLogged(true);
    } catch (error) {
      console.error(error);
      setCode(null);
      localStorage.clear();
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
