import discord from 'discord.js';
import { Entity, Schema, Client } from 'redis-om';

interface GuildCacheData {
  id: string;
  rolesChannelId: string;
  rolesMessageId: string;
}

// Needed for types with redis-om
interface GuildCache extends GuildCacheData {}
class GuildCache extends Entity {}
const schema = new Schema(
  GuildCache,
  {
    id: { type: 'string' },
    rolesChannelId: { type: 'string' },
    rolesMessageId: { type: 'string' },
  },
  { dataStructure: 'JSON' },
);

const GuildRepository = (client: Client) => {
  const cacheMap = new Map<string, string>(); // guildId -> entityId
  const guildRepository = client.fetchRepository(schema);

  async function init(guilds: discord.Guild[]) {
    await guildRepository.createIndex();
    await saveAll(guilds);
  }

  async function create(guild: GuildCacheData) {
    const entity = guildRepository.createEntity({
      id: guild.id,
      rolesChannelId: '',
      rolesMessageId: '',
    });

    const id = await guildRepository.save(entity);

    // Set ttl
    // const ttlInSeconds = 1 * 60 * 60; // 1 hour
    // await guildRepository.expire(id, ttlInSeconds);
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

  async function update(guild: GuildCacheData) {
    let entity = await getByGuildId(guild.id);

    if (!entity) {
      return await create(guild);
    }

    entity.rolesChannelId = guild.rolesChannelId;
    entity.rolesMessageId = guild.rolesMessageId;

    return await guildRepository.save(entity);
  }

  async function saveAll(guilds: discord.Guild[]) {
    const cacheGuilds = await getAll();
    return guilds.map(async (guild) => {
      let cache = cacheGuilds.find((cacheGuild) => cacheGuild.id === guild.id);
      let id;
      if (cache) {
        id = cache.entityId;
      } else {
        console.log('Creating guild cache for ' + guild.id);
        id = await create({ id: guild.id, rolesChannelId: '', rolesMessageId: '' });
      }
      cacheMap.set(guild.id, id);
    });
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
