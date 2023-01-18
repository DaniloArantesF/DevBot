import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionOptions } from '@lib/session';
import { User } from '@api/user';
import type { ApiAuthResponse, UserData } from 'types';

async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

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
    const tokenResponse = await fetch('http://localhost:8000/auth/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const authData = (await tokenResponse.json()) as ApiAuthResponse;

    if (!tokenResponse.ok) {
      return response.status(401).json({});
    }

    // Get user data
    const userResponse = await fetch(
      `http://localhost:8000/discord/user?token=${authData.accessToken}`,
      {
        method: 'GET',
      },
    );
    const userData = (await userResponse.json()) as UserData;

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
