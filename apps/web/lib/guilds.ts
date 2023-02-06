import { cache } from 'react';
import { GuildData } from 'shared/types';
import fetchJson from './fetch';

export const preload = (token: string) => {
  void getGuilds(token);
};

const guildEndpoint = (guildId: string, token: string) =>
  `http://localhost:8000/discord/guilds/${guildId}?token=${token}`;
const guildsEndpoint = (token: string) => `http://localhost:8000/discord/guilds?token=${token}`;

export const getGuilds = cache(async (token?: string) => {
  if (!token) return [];
  try {
    const data = await fetchJson<GuildData[]>(guildsEndpoint(token), {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.log('error fetching guilds');
    return [];
  }
});
