import Layout from 'layouts';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '@lib/session';
import { blankUser } from '@api/user';
import { InferGetServerSidePropsType } from 'next';
import Sidebar from '@components/Sidebar';
import { fetchGuilds } from '@api/guilds';
import classes from '@styles/Dashboard.module.css';
import { DashboardProvider } from '@lib/context/dashboardContext';
import RadioCard from '@components/RadioCard';
import Widget from '@components/Widget';

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

function Dashboard({ user, guilds }: DashboardProps) {
  return (
    <Layout>
      <DashboardProvider>
        <div id="app-container" className={classes.container}>
          <Sidebar guilds={guilds} />
          <section className={classes.body}>
            <Widget className={classes.header} title={'Header'} rows={2} cols={3}></Widget>

            <Widget title={'Server logs'}>
              {[...Array(10)].map((_, i) => (
                <div key={i}>Log {i}</div>
              ))}
            </Widget>

            <Widget title={'Configuration'}>
              <RadioCard title={'Options'} />
            </Widget>
          </section>
        </div>
      </DashboardProvider>
    </Layout>
  );
}

export default Dashboard;
