import discordClient from '@/DiscordClient';
import Discord from 'discord.js';
import { GuildConfigModerationRule } from 'shared/types';

type ModerationRule = GuildConfigModerationRule;

// extend this
type GuildModerationContext = {
  channels: Discord.Collection<string, Discord.TextChannel>;

  // Maps channel id to rules
  rules: Map<string, ModerationRule[]>;
};

class Moderation {
  guilds = new Map<string, GuildModerationContext>();

  constructor() {}

  async setup() {
    discordClient.guilds.cache.forEach(async (guild) => {
      this.guilds.set(guild.id, {
        channels: new Discord.Collection(),
        rules: new Map(),
      });
    });
  }

  async addChannel(channel: Discord.TextChannel, rules?: ModerationRule[]) {}
}

const moderation = new Moderation();
export default moderation;
