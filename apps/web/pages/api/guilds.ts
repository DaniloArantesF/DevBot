import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';
import fetchJson from '@lib/fetch';
import { GuildData } from 'types';
// import type { GuildData } from 'types'

export async function fetchGuilds(token: string) {
  const data = await fetchJson<GuildData[]>(`http://localhost:8000/discord/guilds?token=${token}`, {
    method: 'GET',
  });
  return data;
}

async function handler(request: NextApiRequest, response: NextApiResponse<any>) {
  const auth = request.session.user;
  // console.log(auth);
  if (auth && auth.accessToken) {
    try {
      const data = await fetchGuilds(auth.accessToken);
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ message: 'Error fetching guilds' });
    }
  }
  response.status(400).json([]);
}

export default withIronSessionApiRoute(handler, sessionOptions);
