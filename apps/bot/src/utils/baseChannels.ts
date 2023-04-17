import { TPocketbase } from 'shared/types';

export const BASE_CHANNELS: Pick<
  TPocketbase.UserChannel,
  'channelId' | 'name' | 'type' | 'parentId'
>[] = [
  {
    channelId: 1,
    name: 'welcome',
    type: 0,
    parentId: null,
  },
  {
    channelId: 1,
    name: 'announcements',
    type: 0,
    parentId: null,
  },
  {
    channelId: 3,
    name: 'help',
    type: 0,
    parentId: null,
  },
  {
    channelId: 4,
    name: 'bug-report',
    type: 0,
    parentId: null,
  },
  {
    channelId: 5,
    name: 'logs',
    type: 0,
    parentId: null,
  },
];
