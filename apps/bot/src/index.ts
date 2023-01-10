import DiscordClient from './DiscordClient';
import DataProvider from './DataProvider';

async function BotController() {
  const client = await DiscordClient();
  const dataProvider = await DataProvider();
}

BotController();
