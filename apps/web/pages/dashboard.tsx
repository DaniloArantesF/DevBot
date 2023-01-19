import Layout from 'layouts';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '@lib/session';
import { blankUser } from '@api/user';
import { InferGetServerSidePropsType } from 'next';
import Sidebar from '@components/Sidebar';
import { fetchGuilds } from '@api/guilds';
import classes from '@styles/Dashboard.module.css';

export const getServerSideProps = withIronSessionSsr(async function ({ req, res }) {
  const user = req.session.user;

  // Redirect user
  if (!user || !user.isLoggedIn) {
    return {
      props: {
        user: blankUser,
        guilds: [],
      },
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
      guilds: await fetchGuilds(user.accessToken),
    },
  };
}, sessionOptions);

type DashboardProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Dashboard({ user, guilds }: DashboardProps) {
  return (
    <Layout>
      <div id="app-container" className={classes.container}>
        <Sidebar guilds={guilds} />
      </div>
    </Layout>
  );
}
