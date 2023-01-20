import Layout from 'layouts';
import { DISCORD_AUTH_URL } from '@lib/config';
import { sessionOptions } from '@lib/session';
import { InferGetServerSidePropsType } from 'next';
import { withIronSessionSsr } from 'iron-session/next';
import { fetchAuth, fetchUser } from '@api/auth/login';

export const getServerSideProps = withIronSessionSsr(async function ({ req, res, query }) {
  const user = req.session.user;

  // Redirect logged users
  if (user && user.isLoggedIn) {
    return {
      props: {
        isLoggedIn: true,
      },
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  // Fetch user
  if (query.code) {
    try {
      const authData = await fetchAuth(query.code as string);
      const userData = await fetchUser(authData.accessToken);

      req.session.user = {
        ...authData,
        ...userData,
        isLoggedIn: true,
      };

      await req.session.save();
      return {
        props: {
          isLoggedIn: true,
        },
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  return {
    props: {
      isLoggedIn: false,
    },
  };
}, sessionOptions);

type LoginProps = InferGetServerSidePropsType<typeof getServerSideProps>;

function Login({}: LoginProps) {
  return (
    <Layout>
      <div>
        <h1>Login</h1>
        <a rel="noreferrer nofollow" href={DISCORD_AUTH_URL}>
          Login on discord
        </a>
      </div>
    </Layout>
  );
}

export default Login;
