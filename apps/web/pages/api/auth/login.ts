import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionOptions, User } from 'shared/session';
import { ApiAuthResponse, UserData } from '@lib/types';
import fetchJson from '@lib/fetch';

export async function fetchAuth(code: string) {
  return await fetchJson<ApiAuthResponse>('http://localhost:8000/auth/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
}

export async function fetchUser(token: string) {
  return await fetchJson<UserData>(`http://localhost:8000/discord/user?token=${token}`);
}

async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  // Check code is present
  const { code } = request.body;
  if (!code) {
    return response.status(400).json({ message: 'Missing code' });
  }

  // Don't fire if user is logged in
  if (
    request.session.user &&
    request.session.user.isLoggedIn &&
    request.session.user.expiresAt > Date.now()
  ) {
    return response.status(200).json(request.session.user);
  }

  try {
    const authData = await fetchAuth(code);
    const userData = await fetchUser(authData.accessToken);

    const user = {
      ...authData,
      ...userData,
      isLoggedIn: true,
    } as User;

    request.session.user = user;
    await request.session.save();

    return response.status(200).json(user);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ message: 'Error logging in' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
