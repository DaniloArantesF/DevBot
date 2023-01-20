import { sessionOptions } from 'shared/session';
import { withIronSessionApiRoute } from 'iron-session/next';
import Router from 'next/router';

export async function logout() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
  });

  if (res.status === 200) {
    Router.push('/login');
  }
}

export default withIronSessionApiRoute(async (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
}, sessionOptions);
