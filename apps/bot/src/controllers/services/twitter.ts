import { Client } from 'twitter-api-sdk';

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Handles interaction and communication with the Twitter API
class Twitter extends Client {
  constructor() {
    super(TWITTER_BEARER_TOKEN);
  }

  async getGuildTweets() {}
  async getGuildMemberTweets() {}
}

export default Twitter;
