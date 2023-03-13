import PocketBase from 'pocketbase';
import { TPocketbase } from '@utils/types';

interface UserModel {
  pocketbase: PocketBase;
}

class UserModel {
  constructor(pocketbase: PocketBase) {
    this.pocketbase = pocketbase;
  }

  async create(user: TPocketbase.UserData) {
    try {
      const record = await this.pocketbase.collection('users').create<TPocketbase.User>(user);
      return record;
    } catch (error) {
      return null;
    }
  }

  async update(user: { id: string } & Partial<TPocketbase.UserData>) {
    try {
      const record = await this.pocketbase
        .collection('users')
        .update<TPocketbase.User>(user.id, user);
      return record;
    } catch (error) {
      return null;
    }
  }

  async getByDiscordId(userId: string) {
    const record = await this.pocketbase
      .collection('users')
      .getFirstListItem<TPocketbase.User>(`discordId="${userId}"`);
    return record;
  }
}

export default UserModel;
