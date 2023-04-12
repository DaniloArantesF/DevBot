// Manages the text in messages sent by the bot
export class TextRegistry {
  static messages = {
    welcome: "What's up dog?",
    rulesPinMessage: 'Please read the rules before chatting',
    rulesMessage: (message?: string) =>
      `React to the ✅ to get access to the rest of the server.\n\n${
        message || TextRegistry.messages.rules
      }`,
    rules: `
    Listen up, here are the rules:
    1) Treat everyone with respect. Absolutely no harassment, witch hunting, sexism, racism or hate speech will be tolerated;

    2) No NSFW or obscene content. This includes text, images or links featuring nudity, sex, hard violence or other graphically disturbing content;

    3) If you see something against the rules or something that makes you feel unsafe, let staff know. We want this server to be a welcoming space;

    4) Spam will not be tolerated.`,
    roles: `React to the Emojis to set/unset your roles`,
  };

  static names = {
    welcomeChannel: 'welcome',
    rulesChannel: 'rules',
    rolesCategory: 'roles',
  };
}

const textRegistry = new TextRegistry();
export default TextRegistry;
