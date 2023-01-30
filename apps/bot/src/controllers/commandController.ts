import { queueSettings } from '@/TaskManager';
import { stringifyCircular } from '@/utils';
import { Controller, DiscordCommand, QueueTaskData } from '@/utils/types';
import Queue from 'bee-queue';
import { ChatInputCommandInteraction, Message, MessageType } from 'discord.js';
// TODO: change this later
import botProvider from '@/index';
import { BOT_CONFIG } from 'shared/config';

const COOLDOWN_MS = BOT_CONFIG.cooldownMs;
const PREFIX = BOT_CONFIG.prefix;

type CommandInteraction = ChatInputCommandInteraction | Message;

class CommandController implements Controller<QueueTaskData, CommandInteraction> {
  queue = new Queue<QueueTaskData>('command-queue', queueSettings);
  taskMap = new Map<string, CommandInteraction>();

  constructor() {}

  async addTask(interaction: CommandInteraction) {
    const job = this.queue.createJob({ id: interaction.id });
    job.timeout(2000).retries(2);

    // Check if user is in cooldown
    if (interaction.member) {
      const cooldownMap = (await botProvider).userCooldown;
      const lastInteraction = cooldownMap.get(interaction.member.user.id) ?? -1;
      const timeLeft = lastInteraction === -1 ? 0 : lastInteraction + COOLDOWN_MS - Date.now();

      if (timeLeft > 0) {
        console.info(
          `Delaying command from ${interaction.member.user.username} for ${timeLeft}ms}`,
        );
        job.delayUntil(Date.now() + timeLeft);
      }

      // Update last interaction
      cooldownMap.set(interaction.member.user.id, Date.now());
    }

    await job.save();
    this.taskMap.set(job.id, interaction);
    return job;
  }

  async processTasks(commands: Map<string, DiscordCommand>) {
    this.queue.process(async (job) => {
      const interaction = this.taskMap.get(job.id);
      if (!interaction) return;

      let command = null;
      if (interaction instanceof Message) {
        const commandToken = interaction.content
          .split(' ')[0]
          .slice(PREFIX.length, interaction.content.length);

        // Find command
        command = commands.get(commandToken);
        if (!command) {
          // Check aliases
          command = [...commands.values()].find((c) => c.aliases?.includes(commandToken));
        }
      } else {
        command = commands.get(interaction.commandName);
      }

      if (!command) return;
      const data = await command.execute(interaction);
      if (data) {
        job.data.result = stringifyCircular(data);
      }

      this.taskMap.delete(job.id);
      return job.data;
    });
  }

  async removeTask(id: string) {
    const job = await this.queue.getJob(id);
    await job.remove();
    this.taskMap.delete(id);
  }
}

export default CommandController;
