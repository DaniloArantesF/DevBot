import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, User } from 'shared/session';

export const blankUser: User = {
  accessToken: '',
  refreshToken: '',
  expiresAt: 0,
  id: '',
  username: '',
  avatar: '',
  avatarDecoration: null,
  discriminator: '',
  banner: null,
  bannerColor: null,
  accentColor: null,
  locale: '',
  mfaEnabled: false,
  premiumType: 0,
  publicFlags: 0,
  isLoggedIn: false,
  scope: '',
  tokenType: '',
  flags: 0,
};

async function handler(req: NextApiRequest, res: NextApiResponse<User>) {
  const reqUser = req.session.user;
  if (reqUser && reqUser.accessToken && reqUser.expiresAt > Date.now()) {
    res.json({
      ...reqUser,
      isLoggedIn: true,
    });
    return;
  }
  req.session.user = blankUser as User;
  await req.session.save();
  res.json(blankUser);
}

export default withIronSessionApiRoute(handler, sessionOptions);
