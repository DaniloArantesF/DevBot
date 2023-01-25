import Card from '@components/Card';
import Widget from '@components/Widget';
import classes from '@styles/Dashboard.module.css';
import { DashboardBaseProps, getBaseLayoutProps } from 'layouts/dashboardLayout';
import DashboardLayout from 'layouts/dashboardLayout';
import { sessionOptions } from 'shared/session';
import { withIronSessionSsr } from 'iron-session/next';
import AvatarIcon from '@components/Avatar';
import { getDiscordAvatar } from '@lib/utils';

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
        Hello {user.username}
      </Widget>

      <Widget title={'Server logs'}>
        {[...Array(20)].map((_, i) => (
          <Card key={i} title={`Guild ${i}`}>
            {`Log ${i}`}
          </Card>
        ))}
      </Widget>

      <Widget title={'Managed Guilds'}>
        {guilds
          .filter((g) => g.allowed)
          .map((g, i) => (
            <Card key={i} title={`Guild ${i}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AvatarIcon alt={g.name} src={getDiscordAvatar('guild', g.id, g.icon)} />
                <div>
                  <p>{g.name}</p>
                </div>
              </div>
            </Card>
          ))}
      </Widget>
    </DashboardLayout>
  );
}

export default Dashboard;
