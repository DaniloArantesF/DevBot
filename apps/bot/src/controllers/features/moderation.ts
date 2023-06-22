import discordClient from '@/DiscordClient';
import { listenUserMessages } from '@/tasks/message';
import Discord from 'discord.js';
import { logger } from 'shared/logger';
import { GuildConfigModerationRule, TPocketbase } from 'shared/types';
import FastText from 'fasttext';
import path from 'path';
import { getGuildChannels } from '@/tasks/channels';
import bot from '@/index';
import { Client, Entity, Repository, Schema } from 'redis-om';
import dataProvider from '@/DataProvider';
import TextRegistry from '@/TextRegistry';

type ModerationRule = GuildConfigModerationRule;
type ModerationKey = 'language' | 'content';

// extend this
type GuildModerationContext = {
  channels: Discord.Collection<string, Discord.TextChannel>;

  // Maps channel id to rules
  rules: Map<string, ModerationRule[]>;
};

interface RuleViolationSerializableData {
  userId: string;
  channelId: string;
  guildId: string;
  ruleId: string;
  timestamp: number;
  expiresAt: number;
  warningCount: number;
}
interface RuleViolationRecord extends RuleViolationSerializableData {}
class RuleViolationRecord extends Entity {
  static getWarningKey = (userId: string, guildId: string, ruleId: string) =>
    `MODERATION:WARNING:${guildId}:${userId}`;
  static getPunishmentKey = (userId: string, guildId: string, ruleId: string) =>
    `MODERATION:PUNISH:${guildId}:${userId}`;
}

const ruleViolationSchema = new Schema(
  RuleViolationRecord,
  {
    userId: { type: 'string' },
    channelId: { type: 'string' },
    guildId: { type: 'string' },
    ruleId: { type: 'string' },
    timestamp: { type: 'number' },
    expiresAt: { type: 'number' },
    warningCount: { type: 'number' },
  },
  {
    dataStructure: 'JSON',
  },
);

class ModerationManager {
  classifier: FastText.Classifier | null = null;
  guilds = new Map<string, GuildModerationContext>();
  infractionWindowMs = 7 * 24 * 60 * 60 * 1000; // 1 week;
  isReady = false;
  model = path.resolve(__dirname, 'lid.176.bin');
  redisClient: Client;
  ruleKeys: ModerationKey[] = ['language', 'content'];
  violationCountMap = new Map<string, number>(); // userId:guildId:ruleId -> redisId

  private violationsRepository: Repository<RuleViolationRecord>;

  constructor() {
    this.redisClient = dataProvider.redis;
    this.violationsRepository = this.redisClient.fetchRepository(ruleViolationSchema);
  }

  async setup() {
    logger.Info('ModerationManager', 'Initializing ...');

    try {
      this.classifier = new FastText.Classifier(this.model);
      await this.violationsRepository.dropIndex();
      await this.violationsRepository.createIndex();

      await this.initViolationsMap();
    } catch (error) {
      logger.Error('Moderation', 'Failed to setup moderation module.');
      console.log(error);
    }

    discordClient.guilds.cache.forEach(async (guild) => {
      this.guilds.set(guild.id, {
        channels: new Discord.Collection(),
        rules: new Discord.Collection(),
      });
    });

    discordClient.setMaxListeners(20);
    this.isReady = true;
  }

  async initViolationsMap() {
    const violations = await this.violationsRepository.search().return.all();
    violations.forEach((violation) => {
      const key = `${violation.userId}:${violation.guildId}`;
      if (this.violationCountMap.has(key)) {
        this.violationCountMap.set(key, this.violationCountMap.get(key)! + 1);
      } else {
        this.violationCountMap.set(key, 1);
      }
    });
  }

  async getUserViolations(userId: string, guildId: string, ruleId?: string) {
    return (
      await this.violationsRepository.search().where('userId').eq(userId).return.all()
    ).filter((v) => v.guildId === guildId);
  }

  async getActiveUserViolations(userId: string, guildId: string, ruleId: string) {
    return await this.violationsRepository
      .search()
      .where('userId')
      .eq(userId)
      .and('expiresAt')
      .is.greaterThan(Date.now())
      .return.all();
  }

  async setupGuild(guild: TPocketbase.Guild) {
    logger.Info('Moderation', `Setting up guild "${guild.name}" (${guild.guildId}) ...`);
    const channels = getGuildChannels(guild.guildId)?.map((c) => c) ?? [];
    const moderationConfig = bot.guilds.get(guild.guildId)?.moderationConfig;
    for (const channel of channels) {
      if (channel.type !== Discord.ChannelType.GuildText) continue;
      await this.addChannel(channel, {
        ...moderationConfig,
      });
    }
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
              const infractionCount =
                this.violationCountMap.get(`${message.author.id}:${message.guild?.id}`) ?? 0;
              const violationHandler = await this.getLanguageViolationHandler(infractionCount);
              await violationHandler(message);
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
          /* TODO */
        }
      }
    });
  }

  async getLanguageViolationHandler(infractionCount: number) {
    if (infractionCount < 1) {
      return this.warnUser.bind(this);
    } else if (infractionCount == 1) {
      return this.timeoutUser.bind(this);
    }
    return this.kickUser.bind(this);
  }

  // Adds user to infractors list and applies punishment if needed
  async warnUser(message: Discord.Message) {
    // Check if user exists in redis
    const lastViolation = await this.getActiveUserViolations(
      message.author.id,
      message.guild!.id,
      'language',
    );

    await this.createViolation(message.author.id, {
      userId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guild!.id,
      ruleId: 'language',
      timestamp: Date.now(),
      expiresAt: Date.now() + this.infractionWindowMs,
      warningCount: (lastViolation?.length ?? 0) + 1,
    });
    const reply = await message.reply(TextRegistry.messages.features.moderation.language.warning);
    await bot.rulesManager.removeUserRoles(message.guild!, message.author.id);
    setTimeout(async () => (await message.delete()) && reply.delete(), 5000);
  }

  async createViolation(id: string, violationData: RuleViolationSerializableData) {
    // Set ttl
    const ttlInSeconds = this.infractionWindowMs / 1000;
    const record = await this.violationsRepository.createAndSave({
      id: id,
      ...violationData,
    });
    await this.violationsRepository.expire(record.entityId, ttlInSeconds);
    this.violationCountMap.set(
      `${violationData.userId}:${violationData.guildId}`,
      violationData.warningCount,
    );
    return record;
  }

  async timeoutUser(message: Discord.Message) {
    const guildMember = await message?.guild!.members.fetch(message.author.id);
    try {
      const lastViolation = await this.getActiveUserViolations(
        message.author.id,
        message.guild!.id,
        'language',
      );
      await this.createViolation(message.author.id, {
        userId: message.author.id,
        channelId: message.channel.id,
        guildId: message.guild!.id,
        ruleId: 'language',
        timestamp: Date.now(),
        expiresAt: Date.now() + this.infractionWindowMs,
        warningCount: (lastViolation?.length ?? 0) + 1,
      });

      await guildMember.timeout(5 * 60 * 1000, 'Please use the correct language in this server.');
      await message.delete();
      await bot.rulesManager.removeUserRoles(message.guild!, message.author.id);
    } catch (error) {
      logger.Error('Moderation', 'Failed to timeout user.');
      console.log(error);
    }
  }

  async kickUser(message: Discord.Message) {
    const guildMember = await message?.guild!.members.fetch(message.author.id);
    if (!guildMember || !guildMember.kickable) return;

    try {
      const lastViolation = await this.getActiveUserViolations(
        message.author.id,
        message.guild!.id,
        'language',
      );
      await this.createViolation(message.author.id, {
        userId: message.author.id,
        channelId: message.channel.id,
        guildId: message.guild!.id,
        ruleId: 'language',
        timestamp: Date.now(),
        expiresAt: Date.now() + this.infractionWindowMs,
        warningCount: (lastViolation?.length ?? 0) + 1,
      });

      await bot.rulesManager.removeUserRoles(message.guild!, message.author.id);
      await guildMember.kick('You were warned');
      await message.delete();
    } catch (error) {
      logger.Error('Moderation', 'Failed to kick user.');
      console.log(error);
    }
  }
}

export default ModerationManager;
