import DiscordClient from './DiscordClient';
import DataProvider from './DataProvider';
import taskManager from './TaskManager';
import API from './api';

async function BotController() {
  const discordClient = await DiscordClient();
  const api = API();
  const dataProvider = await DataProvider();

  // Process commands
  taskManager.processCommands(discordClient.commands);

  // Process API tasks
  taskManager.processApiRequests();
}

console.clear();
BotController();
