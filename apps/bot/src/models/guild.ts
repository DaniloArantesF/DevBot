import { BotProvider } from '@/utils/types';
import discord from 'discord.js';
import { TPocketbase } from 'shared/types';

const GuildRepository = (provider: BotProvider) => {
  const cacheMap = new Map<string, string>(); // guildId -> entityId
  const pocketbase = provider.getDataProvider().pocketbase;

  // Syncs guilds with database
  // Stores mapping in cache
  async function init(guilds: discord.Guild[]) {
    const storedGuilds = await getAll();
    for (const guild of guilds) {
      const storedItem = storedGuilds.find((storedGuild) => storedGuild.guildId === guild.id);
      const isStored = storedItem !== undefined;
      if (!isStored) {
        const record = await create({
          guildId: guild.id,
          name: guild.name,
          userRoles: [],
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

  async function update(guild: TPocketbase.Guild) {
    if (!cacheMap.has(guild.guildId)) return null;
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
