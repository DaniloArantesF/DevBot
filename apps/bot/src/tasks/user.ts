import discordClient from '@/DiscordClient';
import { CLIENT_ID, CLIENT_SECRET } from '@/utils/config';
import { DISCORD_API_BASE_URL, PUBLIC_CLIENT_URL } from 'shared/config';
import { DiscordAuthResponse, GuildDiscordData, TBotApi, UserDiscordResponse } from 'shared/types';

// Returns the network of active users in a user's guilds
export async function getUserNetwork() {}

export async function getUserToken(code: string): Promise<TBotApi.AuthData> {
  const data = (await (
    await fetch(`${DISCORD_API_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${PUBLIC_CLIENT_URL}/login`,
        scope:
          'identify connections activities.read applications.commands.permissions.update guilds guilds.members.read applications.commands role_connections.write',
      }),
    })
  ).json()) as DiscordAuthResponse;

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000, //expires_in is in seconds
    refreshToken: data.refresh_token,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function getUserData(token: string): Promise<TBotApi.UserData> {
  const data = (await (
    await fetch(`${DISCORD_API_BASE_URL}/users/@me`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
  ).json()) as UserDiscordResponse;

  return {
    id: data.id,
    username: data.username,
    avatar: data.avatar,
    avatarDecoration: data.avatar_decoration,
    bot: data.bot,
    discriminator: data.discriminator,
    publicFlags: data.public_flags,
    flags: data.flags,
    banner: data.banner,
    bannerColor: data.banner_color,
    accentColor: data.accent_color,
    locale: data.locale,
    mfaEnabled: data.mfa_enabled,
    premiumType: data.premium_type,
  };
}

export async function getUserGuilds(userId: string): Promise<TBotApi.GuildData[]> {
  return discordClient.guilds.cache
    .filter((guild) => guild.members.cache.has(userId))
    .map(({ name, id, icon, ownerId, features, members }) => ({
      name,
      id,
      icon,
      isOwner: ownerId === userId,
      features,
      permissions: members.cache.get(userId)!.permissions.toArray(),
    }));
}

export async function getUserAllGuilds(token: string): Promise<GuildDiscordData[]> {
  return await (
    await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
  ).json();
}
