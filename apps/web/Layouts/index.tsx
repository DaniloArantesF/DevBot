import Head from 'next/head';
import Sidebar from '../components/Sidebar';

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
      <main>
        <Sidebar />
        <div id="app-container">{children}</div>
      </main>
    </>
  );
}
