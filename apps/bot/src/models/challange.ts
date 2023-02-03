import Pocketbase from 'pocketbase';
import { Challange } from '@/utils/types';

interface ChallangeModel {
  pocketbase: Pocketbase;
}

class ChallangeModel {
  constructor(pocketbase: Pocketbase) {
    this.pocketbase = pocketbase;
  }

  async get(challangeId: string) {}

  async getAll() {
    const challanges = await this.pocketbase
      .collection('challanges')
      .getList(1, 100, { filter: 'inProgress=true' });
  }

  async create(challange: Challange) {}

  async update(challange: Challange) {}
}
