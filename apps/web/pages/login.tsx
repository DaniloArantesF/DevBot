import Layout from 'layouts';
import { DISCORD_AUTH_URL } from 'shared/config';
import { sessionOptions } from 'shared/session';
import { InferGetServerSidePropsType } from 'next';
import { withIronSessionSsr } from 'iron-session/next';
import { fetchAuth, fetchUser } from '@api/auth/login';
import Widget from '@components/Widget';
import classes from '@styles/Login.module.css';
import Button from '@components/Button';

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
      <div className={classes.container}>
        <section className={classes.body}>
          <Widget title="Login" style={{ maxWidth: '300px' }}>
            <Button label={'Discord Login'} href={DISCORD_AUTH_URL} />
          </Widget>
        </section>
      </div>
    </Layout>
  );
}

export default Login;
