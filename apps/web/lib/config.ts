export const CLIENT_URL = 'http://localhost:3000';
export const redirectURI = encodeURIComponent(`${CLIENT_URL}/login`);
export const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=712958072007688232&permissions=8&redirect_uri=${redirectURI}&response_type=code&scope=identify%20guilds`;
