import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
  ImagesResponse,
} from 'openai';
import botProvider from '@/index';
import { getGuildChannel } from '@/tasks/channels';
import { Message, TextChannel } from 'discord.js';
import { getLatestChannelMessages } from '@/tasks/message';
import Queue from 'bee-queue';
import { queueSettings } from '@/TaskManager';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const DEFAULT_MODEL = 'text-davinci-003';
const DEFAULT_CHAT_MODEL = 'gpt-3.5-turbo';

const TEST_GUILD_ID = '817654492782657566';
const RUDE_CHANNEL_ID = '1081210052985245747';
const IMAGE_CHANNEL_ID = '1081277554519969903';

interface RequestTask {
  messageId: string;
  type: 'chat' | 'image';
}

interface ChatRequestTask extends RequestTask {
  type: 'chat';
  messages: ChatCompletionRequestMessage[];
}

interface ImageRequestTask extends RequestTask {
  type: 'image';
  prompt: string;
}

type RequestTaskData = ChatRequestTask | ImageRequestTask;

class OpenAI extends OpenAIApi {
  channels = new Map();
  requestQueue = new Queue<RequestTaskData>('openai-request-queue', queueSettings);

  constructor() {
    super(new Configuration({ apiKey: OPENAI_API_KEY }));
    this.setup();
  }

  async addTask(data: RequestTaskData) {
    const job = this.requestQueue.createJob(data);
    return await job.timeout(6000).save();
  }

  /**
   * Processes tasks from the queue and executes the appropriate handler
   */
  async processTasks() {
    this.requestQueue.process(async (job) => {
      const { type } = job.data;
      switch (type) {
        case 'chat':
          console.debug('Executing chat completion task.');
          const { messages } = job.data;
          return await this.replyChat(messages);
        case 'image':
          console.debug('Executing image task.');
          return await this.generateImage(job.data.prompt);
        default:
          return null;
      }
    });
  }

  async setup() {
    await botProvider;

    await this.RudeBot();
    await this.ImageBot();

    this.processTasks();
  }

  async replyChat(messages: ChatCompletionRequestMessage[]) {
    try {
      const { data } = await this.createChatCompletion({
        model: DEFAULT_CHAT_MODEL,
        messages,
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

  async listenChannel(channelId: string, handler: (message: Message) => Promise<void> | void) {
    const channel = (await getGuildChannel(TEST_GUILD_ID, channelId)) as TextChannel;
    channel.client.on('messageCreate', handler);
  }

  async RudeBot() {
    const rudeChannelId = RUDE_CHANNEL_ID;
    const instructions = [
      this.SystemMessage(
        'You are ROLA, a smart pigeon that talks. You are not to break character and mention any variation of being an AI model. You answers questions while mocking users. You are not afraid of being rude, yet you are insightful.',
      ),
    ];

    await this.listenChannel(rudeChannelId, async (message: Message) => {
      if (message.channel.id === rudeChannelId && !message.author.bot) {
        const latestMessages = (
          await getLatestChannelMessages(message.channel as TextChannel, 10)
        ).map((message) =>
          message.author.bot
            ? this.AssistantMessage(message.content)
            : this.UserMessage(message.content),
        );
        const messages = [...instructions, ...latestMessages];
        const job = await this.addTask({ messageId: message.id, type: 'chat', messages });
        job.on('succeeded', async (response: CreateChatCompletionResponse) => {
          if (!response || !response.choices.length) return;
          console.debug(response);
          message.reply(response.choices[0].message.content);
        });
      }
    });
  }

  async ImageBot() {
    const imageChannelId = IMAGE_CHANNEL_ID;
    await this.listenChannel(imageChannelId, async (message: Message) => {
      if (message.channel.id === imageChannelId && !message.author.bot) {
        const prompt = `A picture of a ${message.content}`;

        const job = await this.addTask({ messageId: message.id, type: 'image', prompt });
        job.on('succeeded', async (response: ImagesResponse) => {
          const url = response.data[0].url;
          message.reply(url);
        });
      }
    });
  }

  /* messages */
  SystemMessage = (content: string) =>
    ({
      role: 'system',
      content,
    } as ChatCompletionRequestMessage);

  AssistantMessage = (content: string) =>
    ({
      role: 'assistant',
      content,
    } as ChatCompletionRequestMessage);

  UserMessage = (content: string) =>
    ({
      role: 'user',
      content,
    } as ChatCompletionRequestMessage);
}

export default OpenAI;
