import { Router, Request, Response } from 'express';
import OpenAI from './openai';
import { PocketBase } from '@/DataProvider';
import botProvider from '@/index';
import { TOpenAi } from 'shared/types';

class OpenAiPluginApi {
  openAiController: OpenAI;
  pocketbase?: PocketBase;

  constructor(router: Router, openAiController: OpenAI) {
    this.openAiController = openAiController;

    /* Endpoints */
    router.patch('/openai/:guildId/status', this.setPluginStatus.bind(this));
    this.init();
  }

  async init() {
    this.pocketbase = (await botProvider).getDataProvider().pocketbase;
  }

  /**
   * Enables or disables the openai plugin for a guild
   */
  setPluginStatus = async (request: Request, response: Response) => {
    const { guildId } = request.params;

    if (!this.openAiController.guildRecordMap.has(guildId)) {
      // Create new record
      const guildRecord = await (await botProvider).getDataProvider().guild.get(guildId);
      if (!guildRecord) {
        response.status(400).send('Invalid guildId');
        return;
      }

      const record = await this.pocketbase!.collection('openai_plugin').create<TOpenAi.Record>({
        guildId,
        channels: {},
        guild: guildRecord.id,
      });

      this.openAiController.guildRecordMap.set(guildId, record);
    } else {
      const record = this.openAiController.guildRecordMap.get(guildId);
      if (record) {
        await this.pocketbase!.collection('openai_plugin').delete(record.id);
      }
    }

    response.sendStatus(200);
  };

  updateConfig = async (request: Request, response: Response) => {
    /** TODO */
  };
}

export default OpenAiPluginApi;
