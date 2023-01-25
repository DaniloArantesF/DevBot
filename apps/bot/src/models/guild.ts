import discord, { RoleData } from 'discord.js';
import { Entity, Schema, Client } from 'redis-om';

interface GuildChannelJSON {
  type: number;
  guild?: string;
  guildId: string;
  parentId: null | string;
  permissionOverwrites: string[];
  messages: string[];
  threads: string[];
  nsfw: boolean;
  flags: number;
  id: string;
  name: string;
  rawPosition: number;
  topic: null | string;
  lastMessageId: string | null;
  rateLimitPerUser: number;
  createdTimestamp: number;
}

interface GuildDataItem {
  id: string;
  announcementsChannelId?: string;
  rolesChannelId?: string;
  eventsChannelId?: string;
  channels: GuildChannelJSON[];
  roles: RoleData[];
}

// Needed for types with redis-om
interface GuildCache {
  guilds: string[];
}

class GuildCache extends Entity {}
const schema = new Schema(
  GuildCache,
  {
    guilds: { type: 'string[]' },
  },
  { dataStructure: 'HASH' },
);

const GuildRepository = (client: Client) => {
  let entityId = null;
  const cacheMap = new Map<string, string>();
  const guildRepository = client.fetchRepository(schema);

  async function init(guilds: discord.Guild[]) {
    await guildRepository.createIndex();
    // Remove old data TODO: Update data instead
    await removeAll();

    entityId = await create(guilds);
    return entityId;
  }

  async function create(guilds: discord.Guild[]) {
    const guildsData = guilds.map((guild) => {
      const guildData: GuildDataItem = {
        id: guild.id,
        channels: guild.channels.cache.map((channel) => channel.toJSON()) as GuildChannelJSON[],
        roles: guild.roles.cache.map((role) => role.toJSON()),
      };
      return JSON.stringify(guildData);
    });

    const entity = guildRepository.createEntity({
      guilds: guildsData,
    });

    const id = await guildRepository.save(entity);
    // cacheMap.set(guild.id, id);

    // Set ttl
    const ttlInSeconds = 1 * 60 * 60; // 1 hour
    await guildRepository.expire(id, ttlInSeconds);
    return id;
  }

  async function getByGuildId(guildId: string) {
    // Check local map
    const id = cacheMap.get(guildId);
    if (id) {
      return await guildRepository.fetch(id);
    }

    // Search
    return (await guildRepository.search().where('id').eq(guildId).return.all())[0];
  }

  // TODO
  async function update(guild: discord.Guild) {
    // let entity = await getByGuildId(guild.id);
    // if (!entity) {
    //   return await create(guild);
    // }
    // entity.id = guild.id;
    // entity.data = JSON.stringify(guild.toJSON())
    // return await guildRepository.save(entity);
  }

  async function saveAll(guilds: discord.Guild[]) {
    // const ids = [];
    // for (const guild of guilds) {
    //   const id = await create(guild);
    //   ids.push(id);
    //   cacheMap.set(guild.id, id);
    // }
    // return ids;
  }

  async function getAll() {
    return await guildRepository.search().all();
  }

  async function removeAll() {
    const ids = (await guildRepository.search().all()).map((entity) => entity.entityId);
    await guildRepository.remove(ids);
  }

  return {
    init,
    create,
    getByGuildId,
    getAll,
    removeAll,
    update,
    saveAll,
  };
};

export default GuildRepository;
