import Head from 'next/head';

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function Layout({ title = 'WebBot', children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main style={{ height: '100vh', overflow: 'hidden' }}>{children}</main>
    </>
  );
}
