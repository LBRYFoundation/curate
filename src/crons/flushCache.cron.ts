import { DexareClient, MemoryDataManager } from 'dexare';
import { CurateConfig } from '../bot';

export const name = 'flush-cache';
export const time = '0 * * * *';
export const start = true;
export async function onTick(client: DexareClient<CurateConfig>) {
  const data = client.data as MemoryDataManager;
  data.flushThrottles();
}
