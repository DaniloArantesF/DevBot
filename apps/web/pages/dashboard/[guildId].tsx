import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from 'shared/session';
import { fetchGuild } from '@api/guild';
import { GuildData } from 'shared/types';
import { useEffect } from 'react';
import DashboardLayout, { getBaseLayoutProps, DashboardBaseProps } from 'layouts/dashboardLayout';

export const getServerSideProps = withIronSessionSsr(async function ({ req, res, params }) {
  const user = req.session.user;

  // Redirect user
  if (!user || !params || !user.isLoggedIn) {
    return {
      props: {
        guild: {},
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
      guild: await fetchGuild(params.guildId as string, user.accessToken),
      ...(await getBaseLayoutProps(user)),
    },
  };
}, sessionOptions);

type GuildViewProps = DashboardBaseProps & {
  guild: GuildData;
};

function GuildView({ user, guilds, guild, commands }: GuildViewProps) {
  return (
    <DashboardLayout title={''} user={user} guilds={guilds} commands={commands}>
      <div>{guild.name}</div>
    </DashboardLayout>
  );
}

export default GuildView;
