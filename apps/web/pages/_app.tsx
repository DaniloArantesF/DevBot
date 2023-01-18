import type { AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import '@styles/globals.css';
import fetchJson from '@lib/fetch';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
        onError: (error) => {
          console.error(error);
        },
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}
