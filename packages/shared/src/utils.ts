/**
 * Returns the url for a discord avatar given an avatar hash
 * @param type Type of avatar, either 'user' or 'guild'
 * @param id Id of avatar owner
 * @param avatarHash Avatar hash given by discord
 * @param size Size of img desired
 * @returns
 */
export const getDiscordAvatar = (
  type = 'user',
  id: string,
  avatarHash: string,
  size = 64,
): string => {
  if (!avatarHash) return '';
  const baseUrl = 'https://cdn.discordapp.com/';
  const userPath = `avatars/${id}/${avatarHash}.png`;
  const guildPath = `icons/${id}/${avatarHash}.png`;

  if (type === 'user') {
    return baseUrl + userPath + `?size=${size}`;
  } else if (type === 'guild') {
    return baseUrl + guildPath + `?size=${size}`;
  }
  return '';
};

export const getFormatedChannelName = (channelName: string) => {
  // Replace special characters with an empty string
  const noSpecialChars = channelName.replace(/[^\w\s-]/gi, '');

  // Replace spaces with hyphens
  const hyphenated = noSpecialChars.replace(/\s+/g, '-').toLowerCase();

  // Remove leading and trailing hyphens
  return hyphenated.replace(/^-+|-+$/g, '');
};

const emojiRegex =
  /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|[\u2700-\u27ff])/;

export function isSingleEmoji(input: string): boolean {
  const matches = input.match(emojiRegex) || false;
  return matches && matches.length === 1 && matches[0].length === input.length;
}

export function isSingleCharacterOrEmoji(input: string): boolean {
  if (emojiRegex.test(input)) {
    const matches = input.match(emojiRegex) || false;
    return matches && matches.length === 1 && matches[0].length === input.length;
  } else {
    return input.length === 1;
  }
}

export const HookEvent = (orig: string, key: string) => `${orig}:${key}`;
