import Pocketbase from 'pocketbase';
import { UserData } from '@utils/types';

interface UserModel {
  pocketbase: Pocketbase;
}

class UserModel {
  constructor(pocketbase: Pocketbase) {
    this.pocketbase = pocketbase;
  }

  async create(user: UserData) {
    const data = {
      username: user.username,
      email: '',
      emailVisibility: false,
      password: user.id,
      passwordConfirm: user.id,
      discordId: user.id,
    };

    let record;
    try {
      record = await this.getByDiscordId(user.id);
    } catch (error) {
      record = await this.pocketbase.collection('users').create(data);
    }

    console.log(record);
    return record;
  }

  async getByDiscordId(userId: string) {
    const record = await this.pocketbase
      .collection('users')
      .getFirstListItem(`discordId=${userId}`);
    return record;
  }
}

export default UserModel;
