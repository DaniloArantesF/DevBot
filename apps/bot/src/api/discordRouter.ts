import { Router, Request, Response } from 'express';
import { DISCORD_API_BASE_URL } from '@/utils/config';
import fetch from 'node-fetch';
import type { TBotApi } from '@/utils/types';
import { getGuild } from '@/tasks/guild';
import { getGuildRoles, setRolesMessage } from '@/tasks/roles';
import { stringifyCircular } from '@/utils';
import { createChannel, deleteChannel, getGuildChannel, getGuildChannels } from '@/tasks/channels';
import { APIConnection, ChannelType } from 'discord.js';
import botProvider from '..';
import { getUserGuilds } from '@/tasks/user';
import { logger } from 'shared/logger';
import { withAuth } from './decorators/auth';
import { useApiQueue } from './decorators/queue';
import { withApiLogging } from './decorators/log';

class DiscordRouter {
  router = Router();
  constructor() {
    this.init();
  }

  init() {
    this.router.get('/user', this.getUserData.bind(this));
    this.router.get('/user/connections', this.getUserConnections.bind(this));
    this.router.get('/user/guilds', this.getUserGuilds.bind(this));
    this.router.get('/guilds/:guildId', this.getGuild.bind(this));
    this.router.get('/guilds/:guildId/roles', this.getGuildRoles.bind(this));
    this.router.get('/guilds/:guildId/channels', this.getGuildChannels.bind(this));
    this.router.post('/guilds/:guildId/channel', this.createChannel.bind(this));
    this.router.delete('/guilds/:guildId/channel', this.deleteChannel.bind(this));
    this.router.post('/guilds/:guildId/roles/message', this.setRolesMessage.bind(this));
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getUserData(req: TBotApi.AuthenticatedRequest, res: Response) {
    try {
      const data = req.discordUser!;
      res.status(200).send(data as TBotApi.GetUserResponse);
    } catch (error: any) {
      console.error(`Error `, error);
      res.status(500).send({
        message: error?.message || 'Error fetching user data',
      } as TBotApi.ErrorResponse);
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getUserConnections(req: TBotApi.AuthenticatedRequest, res: Response) {
    const token = req.discordAuth!.accessToken;

    try {
      const data = (await (
        await fetch(`${DISCORD_API_BASE_URL}/users/@me/connections`, {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      ).json()) as APIConnection[];

      const payload: TBotApi.UserConnectionData[] = data.map(
        ({ id, type, name, visibility, verified, friend_sync, show_activity }) => ({
          id,
          type,
          name,
          visibility,
          verified,
          friendSync: friend_sync,
          showActivity: show_activity,
        }),
      );
      res.status(200).send(payload as TBotApi.GetUserConnectionsResponse);
    } catch (error: any) {
      console.error(`Error `, error);
      res.status(500).send({
        message: error?.message || 'Error fetching user data',
      } as TBotApi.ErrorResponse);
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getUserGuilds(req: TBotApi.AuthenticatedRequest, res: Response) {
    try {
      const guilds = await getUserGuilds(req.discordUser!.id);
      res.send(guilds);
    } catch (error) {
      console.error(`Error `, error);
      res.status(500).send(error);
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getGuild(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId;
    const guild = await getGuild(guildId);

    if (!guild) {
      res.status(404).send('Guild not found');
      return;
    }

    if (!guild.members.cache.has(req.discordUser!.id)) {
      res.status(403).send({ message: 'Forbidden' });
    }

    res.send(guild);
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getGuildRoles(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId;
    // TODO: improve this
    const roles = (await getGuildRoles(guildId))?.map((role) =>
      JSON.parse(stringifyCircular(role)),
    );
    res.send(roles ?? []);
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async setRolesMessage(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId;
    const channelId = req.body?.channelId as string;
    if (!channelId) {
      res.status(400).send('Missing channelId');
      return;
    }

    const guild = await getGuild(guildId);
    if (!guild) {
      res.status(404).send('Guild not found');
    }

    // TODO: check that guild is valid & that user is guild admin
    if (!channelId) {
      res.status(400).send('Missing guildId or channelId');
    }

    try {
      const roles = (await (await botProvider).getDataProvider().guild.get(guildId)).userRoles;
      const data = await setRolesMessage(guildId, channelId, roles);
      res.send(stringifyCircular(data));
    } catch (error) {
      console.error('Error setting roles message', error);
      res.status(500).send(error);
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async getGuildChannels(req: TBotApi.AuthenticatedRequest, res: Response) {
    const guildId = req.params.guildId;
    const guild = await getGuild(guildId);

    if (!guild) {
      res.status(404).send('Guild not found');
      return;
    }

    // Check that user is in guild
    if (!guild.members.cache.has(req.discordUser!.id)) {
      res.status(403).send('Forbidden');
    }

    const channels = await getGuildChannels(guildId);

    if (!channels) {
      res.status(404).send('Guild not found');
      return;
    }

    const channelData: TBotApi.ChannelData[] =
      channels?.map(
        ({ id, name, createdTimestamp, flags, guildId, parentId, type, ...channel }) => ({
          createdTimestamp: createdTimestamp ?? 0,
          flags: flags.toJSON(),
          guildId,
          id,
          name,
          parentId,
          rawPosition: 0,
          type,
        }),
      ) ?? [];

    res.send({
      channels: channelData,
    });
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async createChannel(req: TBotApi.AuthenticatedRequest, res: Response) {
    let reply;
    let channelType: ChannelType;
    const guildId = req.params.guildId;
    const guild = await getGuild(guildId);
    const channelName = req.body?.channelName as string;
    let channelParent = req.body?.channelParent as string;

    // Check that guild exists
    if (!guild) {
      reply = 'Guild not found';
      res.status(404).send(reply);
      return;
    }

    // Get channel type
    switch (req.body?.channelType) {
      case 'GUILD_TEXT':
        channelType = ChannelType.GuildText;
        break;
      case 'GUILD_VOICE':
        channelType = ChannelType.GuildVoice;
        break;
      case 'GUILD_CATEGORY':
        channelType = ChannelType.GuildCategory;
        channelParent = '';
        break;
      default:
        reply = 'Invalid channel type';
        res.status(400).send(reply);
        return;
    }

    if (channelParent) {
      // Check that parent channel exists
      const parentChannel = await getGuildChannel(guildId, channelParent);
      if (!parentChannel || parentChannel.type !== ChannelType.GuildCategory) {
        reply = 'Invalid parent channel';
        res.status(404).send(reply);
        return;
      }
    }

    try {
      const channel = await createChannel(guildId, {
        name: channelName,
        type: channelType,
        ...(channelParent && { parent: channelParent }),
      });

      const channelData: TBotApi.ChannelData = {
        createdTimestamp: channel.createdTimestamp,
        flags: 0,
        guildId: channel.guildId,
        id: channel.id,
        name: channel.name,
        parentId: channel.parent?.id ?? null,
        rawPosition: channel.rawPosition,
        type: channel.type,
      };

      res.send(channelData as TBotApi.CreateChannelResponse);
    } catch (error) {
      reply = 'Error creating channel';
      logger.Error('APIController', reply);
      console.error(error);
      res.status(500).send({ message: reply });
    }
  }

  @withAuth(['user'])
  @useApiQueue()
  @withApiLogging()
  async deleteChannel(req: TBotApi.AuthenticatedRequest, res: Response) {
    let reply;
    const guildId = req.params.guildId;
    const channelId = req.body?.channelId as string;

    if (!channelId) {
      reply = 'Missing channelId';
      res.status(400).send(reply);
    }

    // Check that guild exists
    const guild = await getGuild(guildId);
    if (!guild) {
      reply = 'Guild not found';
      res.status(404).send(reply);
    }

    try {
      await deleteChannel(guildId, channelId);
      reply = 'Ok';
      res.send({ message: reply });
    } catch (error) {
      reply = 'Error deleting channel';
      logger.Error('APIController', reply);
      console.error(error);
      res.status(500).send({ message: reply });
    }
  }
}

const discordRouter = new DiscordRouter();
export default discordRouter;
