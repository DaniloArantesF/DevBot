import Widget from '@components/Widget';
import classes from '@styles/Dashboard.module.css';
import { DashboardBaseProps, getBaseLayoutProps } from 'layouts/dashboardLayout';
import DashboardLayout from 'layouts/dashboardLayout';
import { sessionOptions } from 'shared/session';
import { withIronSessionSsr } from 'iron-session/next';

type DashboardProps = DashboardBaseProps & {};

export const getServerSideProps = withIronSessionSsr(async function ({ req, res }) {
  const user = req.session.user;

  // Redirect user
  if (!user || !user.isLoggedIn) {
    return {
      props: {
        ...(await getBaseLayoutProps(null)),
      },
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await getBaseLayoutProps(user)),
    },
  };
}, sessionOptions);

function Dashboard({ user, guilds, commands }: DashboardProps) {
  return (
    <DashboardLayout title={''} user={user} guilds={guilds} commands={commands}>
      <Widget className={classes.header} title={''}>
        <h2>
          Hello <span>{user.username}</span>
        </h2>
      </Widget>

      <Widget title={'Scheduled Events'} />
      <Widget title={'Managed Guilds'} />
    </DashboardLayout>
  );
}

export default Dashboard;
