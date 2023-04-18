import PocketBase from 'pocketbase';
import { TPocketbase } from '@utils/types';

interface UserModel {
  pocketbase: PocketBase;
}

class UserModel {
  admins = new Set();
  users = new Set();

  constructor(pocketbase: PocketBase) {
    this.pocketbase = pocketbase;
  }

  async init() {
    const data = await this.pocketbase
      .collection('users')
      .getFullList<TPocketbase.User>(1, { $autoCancel: false });
    const admins = data.filter((user) => user.isAdmin);
    const users = data.filter((user) => !user.isAdmin);

    admins.forEach((admin) => {
      this.admins.add(admin.discordId);
    });

    users.forEach((user) => {
      this.users.add(user.discordId);
    });
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
