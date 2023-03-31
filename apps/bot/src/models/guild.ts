import dataProvider from '@/DataProvider';
import discord from 'discord.js';
import { BOT_CONFIG } from 'shared/config';
import { TPocketbase } from 'shared/types';

const GuildRepository = (pocketbase: typeof dataProvider.pocketbase) => {
  const cacheMap = new Map<string, string>(); // guildId -> entityId

  // Syncs guilds with database
  // Stores mapping in cache
  async function init(guilds: discord.Guild[]) {
    let storedGuilds: TPocketbase.Guild[] = [];

    try {
      storedGuilds = await getAll();
    } catch (error) {
      console.error(error);
      return;
    }

    for (const guild of guilds) {
      const storedItem = storedGuilds.find((storedGuild) => storedGuild.guildId === guild.id);
      const isStored = storedItem !== undefined;
      if (!isStored) {
        const record = await create({
          guildId: guild.id,
          name: guild.name,
          userRoles: [],
          userChannels: [],
          description: '',
          memberRoleId: '',
          channels: [],
          plugins: [],
          managed: false,
          moderation: {
            ...BOT_CONFIG.globalModerationConfig,
          },
        });
        if (!record) continue;
        cacheMap.set(guild.id, record.id);
      } else {
        cacheMap.set(guild.id, storedItem.id);
      }
    }
  }

  async function create(guild: TPocketbase.GuildData) {
    try {
      const record = await pocketbase.collection('servers').create(guild);
      return record;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async function get(guildId: string) {
    if (cacheMap.has(guildId)) {
      return await pocketbase
        .collection('servers')
        .getOne<TPocketbase.Guild>(cacheMap.get(guildId)!);
    }
    return await pocketbase
      .collection('servers')
      .getFirstListItem<TPocketbase.Guild>(`guildId="${guildId}"`);
  }

  async function getByName(guildName: string) {
    return await pocketbase
      .collection('servers')
      .getFirstListItem<TPocketbase.Guild>(`name="${guildName}"`);
  }

  async function getAll() {
    return await pocketbase
      .collection('servers')
      .getFullList<TPocketbase.Guild>(1, { $autoCancel: false });
  }

  async function update(guild: { guildId: string } & Partial<TPocketbase.GuildData>) {
    const record = await pocketbase
      .collection('servers')
      .update<TPocketbase.Guild>(cacheMap.get(guild.guildId)!, guild);
    return record;
  }

  return {
    init,
    create,
    get,
    getByName,
    getAll,
    update,
  };
};

export default GuildRepository;
