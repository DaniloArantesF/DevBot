import { EventLog } from '@/tasks/logs';

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const stringifyCircular = (obj: any) => JSON.stringify(obj, getCircularReplacer());

export function withEventLogging(eventName: string, fn: (...args: any[]) => Promise<any>) {
  return async function (...args: any[]) {
    const result = await fn(...args);
    return EventLog(eventName, stringifyCircular(args) + '\n' + stringifyCircular(result));
  };
}
