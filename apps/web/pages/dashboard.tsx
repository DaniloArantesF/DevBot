import Layout from 'Layouts';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '@lib/session';
import { blankUser } from '@api/user';
import { InferGetServerSidePropsType } from 'next';

export const getServerSideProps = withIronSessionSsr(async function ({ req, res }) {
  const user = req.session.user;

  // Redirect user
  if (!user || !user.isLoggedIn) {
    return {
      props: {
        user: blankUser,
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
    },
  };
}, sessionOptions);

type DashboardProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Dashboard({ user }: DashboardProps) {
  return (
    <Layout>
      <div>
        <h1>Dashboard</h1>
        <p>Hello {user.username}</p>
      </div>
    </Layout>
  );
}
