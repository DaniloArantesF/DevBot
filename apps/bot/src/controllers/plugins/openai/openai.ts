import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
  ImagesResponse,
  CreateCompletionResponse,
} from 'openai';
import { getGuildChannel } from '@/tasks/channels';
import { Message, TextChannel } from 'discord.js';
import { getLatestChannelMessages } from '@/tasks/message';
import Queue from 'bee-queue';
import { queueSettings } from '@/TaskManager';
import { TOpenAi } from 'shared/types';
import { OPENAI_API_KEY } from '@/utils/config';
import OpenAiPluginApi from './openaiApi';
import dataProvider from '@/DataProvider';
import api from '@/api';
import { TPluginController } from '@/utils/types';

class OpenAI extends OpenAIApi implements TPluginController<TOpenAi.RequestTaskData> {
  queue!: Queue<TOpenAi.RequestTaskData>;
  id = 'openAi';
  api?: OpenAiPluginApi;
  guildRecordMap = new Map<string, TOpenAi.Record>();
  channels = new Map<string, { [key: string]: string }>();
  config = {
    completionModel: 'text-davinci-003',
    chatModel: 'gpt-3.5-turbo',
    codeModel: 'code-davinci-002',

    taskTimeout: 15 * 1000,
    codeTaskTimeout: 3 * 60 * 1000,
  };

  constructor() {
    super(new Configuration({ apiKey: OPENAI_API_KEY }));
  }

  async init() {
    this.queue = new Queue<TOpenAi.RequestTaskData>('openai-request-queue', queueSettings);
    const guildConfigList = await this.getPluginData();

    for (const guildConfig of guildConfigList) {
      this.guildRecordMap.set(guildConfig.guildId, guildConfig);

      const { guildId, channels } = guildConfig;
      console.debug(`[${guildId}] Setting up bots.`);
      this.channels.set(guildId, channels);

      // TODO: setup bots
    }

    this.processTasks();
    await this.setupApi();
  }

  // Waits for bot provider to be ready before setting up the api
  async setupApi() {
    // Setup plugin api
    const pluginRouter = api.routers['/plugins'];
    this.api = new OpenAiPluginApi(pluginRouter);
  }

  // Retrieves plugin config data from database
  async getPluginData() {
    const pocketbase = dataProvider.pocketbase;
    await pocketbase.isAdmin;
    return await pocketbase.collection('openai_plugin').getFullList<TOpenAi.Record>();
  }

  async addTask(data: TOpenAi.RequestTaskData) {
    const job = this.queue.createJob(data);
    return await job
      .timeout(data.type === 'code' ? this.config.codeTaskTimeout : this.config.taskTimeout)
      .save();
  }

  /**
   * Processes tasks from the queue and executes the appropriate handler
   */
  async processTasks() {
    this.queue.process(async (job) => {
      job.reportProgress(1); // report that task has started
      let res;
      const { type } = job.data;
      switch (type) {
        case 'chat':
          res = await this.replyChat(job.data.messages);
          break;
        case 'image':
          res = await this.generateImage(job.data.prompt);
          break;
        case 'code':
          res = await this.replyCode(job.data.prompt);
          break;
        default:
          return null;
      }

      // Save response to cache
      job.data.response = res;
      job.save();
      return res;
    });
  }

  async replyChat(messages: ChatCompletionRequestMessage[]) {
    try {
      const { data } = await this.createChatCompletion({
        model: this.config.chatModel,
        messages,
      });
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async replyCode(prompt: string) {
    try {
      const { data } = await this.createCompletion({
        model: this.config.codeModel,
        prompt,
        temperature: 0,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async generateImage(prompt: string) {
    try {
      const { data } = await this.createImage({ prompt });
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async listenChannel(
    guildId: string,
    channelId: string,
    handler: (message: Message) => Promise<void> | void,
  ) {
    const channel = (await getGuildChannel(guildId, channelId)) as TextChannel;
    channel.client.on('messageCreate', handler);
    return () => channel.client.off('messageCreate', handler);
  }

  async ChatBot(
    guildId: string,
    channelId: string,
    name: string,
    instructions: ChatCompletionRequestMessage[],
  ) {
    const dispose = await this.listenChannel(guildId, channelId, async (message: Message) => {
      if (message.channel.id === channelId && !message.author.bot) {
        const latestMessages = (
          await getLatestChannelMessages(message.channel as TextChannel, 3)
        ).map((message) =>
          message.author.bot
            ? this.AssistantMessage(message.content)
            : this.UserMessage(message.content),
        );

        const job = await this.addTask({
          messageId: message.id,
          type: 'chat',
          messages: [...instructions, ...latestMessages],
        });
        job.on('succeeded', async (response: CreateChatCompletionResponse) => {
          if (!response || !response.choices) return;
          message.reply(response.choices[0].message?.content ?? 'No response');
        });
      }
    });

    return dispose;
  }

  async CodeBot(guildId: string, channelId: string) {
    const dispose = await this.listenChannel(guildId, channelId, async (message: Message) => {
      if (message.channel.id === channelId && !message.author.bot) {
        const job = await this.addTask({
          messageId: message.id,
          type: 'code',
          prompt: message.content,
        });

        let reply: Message;
        job.on('progress', async (progress) => {
          reply = await message.reply('Generating code, please wait.');
        });
        job.on('succeeded', async (response: CreateCompletionResponse) => {
          if (!response || !response.choices.length || !response.choices[0].text) {
            reply.edit('Code came back empty :(');
            return;
          }
          console.debug(response);
          reply.edit(response.choices[0].text);
        });

        job.on('failed', async (error: Error) => {
          console.error(error);
          reply.edit('There was an error generating code.');
        });
      }
    });
    return dispose;
  }

  async ImageBot(guildId: string, channelId: string) {
    const dispose = await this.listenChannel(guildId, channelId, async (message: Message) => {
      if (message.channel.id === channelId && !message.author.bot) {
        const prompt = `${message.content}`;
        const job = await this.addTask({ messageId: message.id, type: 'image', prompt });
        job.on('succeeded', async (response: ImagesResponse) => {
          if (!response || !response.data) {
            message.reply('Image came back empty :(');
          } else {
            const url = response.data[0].url ?? '';
            message.reply(url);
          }
        });
      }
    });
    return dispose;
  }

  /* message constructors */
  SystemMessage: TOpenAi.ChatMessage = (content) => ({
    role: 'system',
    content,
  });

  AssistantMessage: TOpenAi.ChatMessage = (content) => ({
    role: 'assistant',
    content,
  });

  UserMessage: TOpenAi.ChatMessage = (content) => ({
    role: 'user',
    content,
  });
}

const openAiPlugin = new OpenAI();
export default openAiPlugin;
