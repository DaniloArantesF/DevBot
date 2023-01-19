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
