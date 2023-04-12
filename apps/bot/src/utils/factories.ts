import { BOT_CONFIG } from 'shared/config';
import { Factory, GuildBotContext } from 'shared/types';

export const GuildContext: Factory<GuildBotContext> = (args) => ({
  ...(args || {}),
  logChannel: null,
  rulesChannel: null,
  rulesMessage: null,
  memberRole: null,
  rolesCategory: null,
  roleUserChannels: new Map(),
  userRoles: new Map(),
  moderationConfig: { ...BOT_CONFIG.globalModerationConfig },
  userChannelCategory: new Map(),
  reactionChannels: new Map(),
  roleEmojiMap: new Map(),
});
