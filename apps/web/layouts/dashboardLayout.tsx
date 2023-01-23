import Head from 'next/head';
import { User } from 'shared/session';
import { blankUser } from '@api/user';
import { fetchGuilds } from '@api/guilds';
import { fetchCommands } from '@api/bot';
import classes from '@styles/DashboardLayout.module.css';
import Sidebar from '@components/Sidebar';

export async function getBaseLayoutProps(user: User | null) {
  return {
    user: user || blankUser,
    guilds: user ? await fetchGuilds(user.accessToken) : [],
    commands: user ? await fetchCommands() : [],
  };
}

export type DashboardBaseProps = Awaited<typeof getBaseLayoutProps extends (user: infer U) => infer R ? R : never>;

type LayoutProps = DashboardBaseProps & {
  title?: string;
  children: React.ReactNode;
}

function DashboardLayout({ guilds, commands, title = 'WebBot', children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main style={{ height: '100vh', overflow: 'hidden' }}>
      <div id="app-container" className={classes.container}>
          <Sidebar guilds={guilds} commands={commands} />
          <section className={classes.body}>
            {children}
          </section>
      </div>
      </main>
    </>
  );
}

export default DashboardLayout;