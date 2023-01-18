import useUser from '@lib/hooks/useUser';
import Layout from 'Layouts';
import Router from 'next/router';

export interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title = 'WebBot', children }: LayoutProps) {
  const { user } = useUser();

  return !user || !user.isLoggedIn ? (
    Router.push('/login')
  ) : (
    <Layout title={title}>{children}</Layout>
  );
}
