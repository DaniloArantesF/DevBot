import { Router, Request, Response } from 'express';
import openAiController from './openai';
import dataProvider, { PocketBase } from '@/DataProvider';
import { TOpenAi } from 'shared/types';
import FastText from 'fasttext';
// import path from 'path';

class OpenAiPluginApi {
  pocketbase?: PocketBase;

  // //

  constructor(router: Router) {
    this.init();

    // router.post('/language', this.detectLanguage.bind(this));
  }

  async init() {
    this.pocketbase = dataProvider.pocketbase;
  }

  /**
   * Enables or disables the openai plugin for a guild
   */
  setPluginStatus = async (request: Request, response: Response) => {
    const { guildId } = request.params;

    if (!openAiController.guildRecordMap.has(guildId)) {
      // Create new record
      const guildRecord = await dataProvider.guild.get(guildId);
      if (!guildRecord) {
        response.status(400).send('Invalid guildId');
        return;
      }

      const record = await this.pocketbase!.collection('openai_plugin').create<TOpenAi.Record>({
        guildId,
        channels: {},
        guild: guildRecord.id,
      });

      openAiController.guildRecordMap.set(guildId, record);
    } else {
      const record = openAiController.guildRecordMap.get(guildId);
      if (record) {
        await this.pocketbase!.collection('openai_plugin').delete(record.id);
      }
    }

    response.sendStatus(200);
  };

  // detectLanguage = async (request: Request, response: Response) => {
  //   const message = request.body.message;
  //   const data = await this.classifier.predict(message, 5);
  //   response.send(data);
  // };

  updateConfig = async (request: Request, response: Response) => {
    /** TODO */
  };
}

export default OpenAiPluginApi;
