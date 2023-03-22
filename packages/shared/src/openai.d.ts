declare namespace TOpenAi {
  export type ChatMessage = (content: string) => ChatCompletionRequestMessage;

  export type TaskType = 'chat' | 'image' | 'code' | 'completion';

  export type BotConfig = {
    name: string;
  } & (
    | {
        type: 'chat';
        baseMessages: ChatCompletionRequestMessage[];
      }
    | {
        type: 'image';
        promptPrefix: string;
      }
    | {
        type: 'completion';
        promptPrefix: string;
      }
    | {
        type: 'code';
        promptPrefix: string;
      }
  );

  export interface RequestTask {
    messageId: string;
    type: TaskType;
  }

  export interface ChatRequestTask extends RequestTask {
    type: 'chat';
    messages: ChatCompletionRequestMessage[];
    response?: CreateChatCompletionResponse;
  }

  export interface ImageRequestTask extends RequestTask {
    type: 'image';
    prompt: string;
    response?: ImagesResponse;
  }

  export interface CompletionRequestTask extends RequestTask {
    response?: CreateCompletionResponse;
    type: 'completion' | 'code';
    prompt: string;
  }

  export type RequestTaskData = CompletionRequestTask | ChatRequestTask | ImageRequestTask;

  export type Record = {
    id: string;
    created: string;
    updated: string;
  } & RecordData;
  export type RecordData = {
    guild: string;
    guildId: string;
    channels: {
      [key: string]: string;
    };
  };
}

export { TOpenAi };
