import { sessionOptions } from 'shared/session';
import { withIronSessionSsr } from 'iron-session/next';

export const getServerSideProps = withIronSessionSsr(async function ({ req, res }) {
  const user = req.session.user;

  // Redirect user
  if (!user || !user.isLoggedIn) {
    return {
      props: {},
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
}, sessionOptions);

export default function Web() {
  return (
    <div>
      <h1>Web</h1>
    </div>
  );
}
