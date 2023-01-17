import { Client } from 'redis-om';
import { REDIS_URL } from '@utils/config';
import GuildRepository from './models/guild';
import type { BotProvider } from '@utils/types';

async function DataProvider(provider: BotProvider) {
  const client = new Client();
  try {
    await connect();
  } catch (error) {
    console.log('Error connecting to redis');
    console.error(error);
  }

  const guildRepository = await GuildRepository(client);

  // Create a connection to redis
  async function connect() {
    if (!client.isOpen()) {
      await client.open(REDIS_URL);
    }
  }

  // Remove all data from redis
  async function cleanUp() {
    await guildRepository.removeAll();
  }

  return { client, cleanUp };
}

export default DataProvider;
