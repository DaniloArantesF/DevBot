import { CommandInteractionOption } from 'discord.js';

declare namespace TCache {
  type Base = {
    user?: string;
    channel?: string;
    guildId?: string;
    data?: string;
    error?: string;
  };

  type Command = Base & {
    command: string;
    args: string[] | CommandInteractionOption[];
    reply: string;
  };

  type Request = Base & {
    method: string;
    status: number;
    url: string;
  };

  type Event = Base & {
    event: string;
  };
}

export type { TCache };
