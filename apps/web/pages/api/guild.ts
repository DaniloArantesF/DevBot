import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from 'shared/session';
import fetchJson from '@lib/fetch';
import { GuildData } from '@lib/types';

export async function fetchGuild(guildId: string, token: string) {
  const data = await fetchJson<GuildData>(`http://localhost:8000/discord/guilds/${guildId}?token=${token}`, {
    method: 'GET',
  });
  return data;
}

async function handler(request: NextApiRequest, response: NextApiResponse<any>) {
  const auth = request.session.user;
  const guildId = request.query.guildId as string;

  if (auth && auth.accessToken) {
    try {
      const data = await fetchGuild(guildId, auth.accessToken);
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ message: 'Error fetching guilds' });
    }
  }
  response.status(400).json([]);
}

export default withIronSessionApiRoute(handler, sessionOptions);
