import discord from 'discord.js';
import { Entity, Schema, Client } from 'redis-om';

interface Guild {
  id: string;
  data: string;
}

class Guild extends Entity {}
const schema = new Schema(
  Guild,
  {
    id: { type: 'string' },
    data: { type: 'string' },
  },
  { dataStructure: 'JSON' },
);

const GuildRepository = async (client: Client) => {
  const cacheMap = new Map<string, string>();
  const guildRepository = client.fetchRepository(schema);
  await guildRepository.createIndex();

  async function create(guild: discord.Guild) {
    const entity = guildRepository.createEntity({
      id: guild.id,
      data: JSON.stringify(guild.toJSON()),
    });

    const id = await guildRepository.save(entity);
    cacheMap.set(guild.id, id);

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
  async function update(guildId: string) {
    const entity = await getByGuildId(guildId);
    if (!entity) {
      return;
    }
    // entity.id = 'MY NEW ID';
    return await guildRepository.save(entity);
  }

  async function getAll() {
    return await guildRepository.search().all();
  }

  async function removeAll() {
    const ids = (await guildRepository.search().all()).map((entity) => entity.entityId);
    await guildRepository.remove(ids);
  }

  return {
    create,
    getByGuildId,
    getAll,
    removeAll,
    update,
  };
};

export default GuildRepository;
