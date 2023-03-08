import { cache } from 'react';
import { TBotApi } from 'shared/types';
import fetchJson from './fetch';
import { BOT_URL } from 'shared/config';

export const preload = (token: string) => {
  void getGuilds(token);
};

const guildEndpoint = (guildId: string, token: string) =>
  `${BOT_URL}/discord/guilds/${guildId}?token=${token}`;
const guildsEndpoint = (token: string) => `${BOT_URL}/discord/guilds?token=${token}`;

export const getGuilds = cache(async (token?: string) => {
  if (!token) return [];
  try {
    const data = await fetchJson<TBotApi.GuildData[]>(guildsEndpoint(token), {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.log('error fetching guilds');
    return [];
  }
});
