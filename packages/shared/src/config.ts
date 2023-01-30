/* -------------------------------- */
/*           Shared Config          */
/* -------------------------------- */
export const BOT_CONFIG = {
  prefix: '!',
  // *Note* The discord api requires a reply within 3 seconds. If cooldown is greater than 3000, you need to defer reply and edit it later.
  cooldownMs: 2500,
};

// Host configuration
export const CLIENT_URL = 'http://localhost:3000';
export const REDIS_URL = 'redis://localhost:6379';
export const BOT_URL = 'http://localhost:8000';
export const PORT = 8000;
export const CLIENT_PORT = 3000;
export const redirectURI = encodeURIComponent(`${CLIENT_URL}/login`);

// Discord configuration
export const DISCORD_API_BASE_URL = 'https://discord.com/api';
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&redirect_uri=${redirectURI}&response_type=code&scope=identify%20connections%20guilds`;
