// Manages the text in messages sent by the bot
class TextManager {
  static messages = {
    welcome: "What's up dog?",
    rules: `
    Listen up, here are the rules:
    1) Treat everyone with respect. Absolutely no harassment, witch hunting, sexism, racism or hate speech will be tolerated;

    2) No NSFW or obscene content. This includes text, images or links featuring nudity, sex, hard violence or other graphically disturbing content;

    3) If you see something against the rules or something that makes you feel unsafe, let staff know. We want this server to be a welcoming space;

    4) Spam will not be tolerated.`,
    roles: `React tp the Emojis to set/unset your roles`,
  };
}

const textManager = new TextManager();
export default textManager;
