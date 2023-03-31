import discordClient from '@/DiscordClient';
import { listenUserMessages } from '@/tasks/channels';
import Discord from 'discord.js';
import { logger } from 'shared/logger';
import { GuildConfigModerationRule } from 'shared/types';
import FastText from 'fasttext';
import path from 'path';
import eventController from '../eventController';

type ModerationRule = GuildConfigModerationRule;
type ModerationKey = 'language' | 'content';

// extend this
type GuildModerationContext = {
  channels: Discord.Collection<string, Discord.TextChannel>;

  // Maps channel id to rules
  rules: Map<string, ModerationRule[]>;
};

class Moderation {
  guilds = new Map<string, GuildModerationContext>();
  ruleKeys: ModerationKey[] = ['language', 'content'];
  model = path.resolve(__dirname, 'lid.176.bin');
  classifier: FastText.Classifier | null = null;
  isReady = false;

  constructor() {}

  async setup() {
    try {
      this.classifier = new FastText.Classifier(this.model);
    } catch (error) {
      logger.Error('Moderation', 'Failed to load language model');
      console.log(error);
    }

    discordClient.guilds.cache.forEach(async (guild) => {
      this.guilds.set(guild.id, {
        channels: new Discord.Collection(),
        rules: new Map(),
      });
    });

    eventController.eventBus.on<Discord.Message>(Discord.Events.MessageCreate, (message) => {});
    discordClient.setMaxListeners(20);
    this.isReady = true;
  }

  async addChannel(channel: Discord.TextChannel, rules?: { [key: string]: ModerationRule }) {
    if (!this.isReady) return;
    logger.Debug('Moderation', `Listening channel "${channel.name}" (${channel.id})`);

    listenUserMessages(channel, async (message) => {
      // Skip admins
      const isAdmin = message.member?.permissions.has(
        Discord.PermissionsBitField.Flags.Administrator,
      );
      if (isAdmin) return;

      // Check language
      if (rules?.language && this.classifier) {
        const rule = rules.language;
        if (rule.enabled) {
          try {
            const languageData = await this.classifier.predict(message.content, 5);
            const language = languageData[0].label.replace(/__label__/g, '');
            if (!rule.allowed.includes(language)) {
              const reply = await message.reply(
                'Only english is allowed here. Please use the correct language or I will kick you into oblivion.',
              );
              setTimeout(async () => (await message.delete()) && reply.delete(), 5000);
            }
          } catch (error) {
            console.log(error);
          }
        }
      }

      // Check content
      if (rules?.content) {
        const rule = rules.content;
        if (rule.enabled) {
          // TODO
        }
      }
    });
  }
}

const moderation = new Moderation();
export default moderation;
