import { describe, expect, test } from 'vitest';
import { getGuild, getGuildByName } from '../src/tasks/guild';

describe('Guild controller', async () => {
  test('getGuild', async () => {
    const guild = await getGuild('817654492782657566');
    expect(guild).toBeDefined();
    expect(guild.name).toBe('MyDiscordServer');
  });

  test('getGuildByName', async () => {
    const guild = await getGuildByName('MyDiscordServer');
    expect(guild).toBeDefined();
    expect(guild.id).toBe('817654492782657566');
  });
});
