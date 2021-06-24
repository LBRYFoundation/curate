import { DexareModule, DexareClient, BaseConfig } from 'dexare';
import fs from 'fs';
import path from 'path';
import { Writer } from 'steno';
import { CurateConfig } from '../bot';

export interface WalletConfig extends BaseConfig {
  wallet?: WalletModuleOptions;
}

export interface WalletModuleOptions {
  path: string;
  backupFolder: string;
}

export default class WalletModule<T extends DexareClient<CurateConfig>> extends DexareModule<T> {
  lastBackup: number = 0;

  constructor(client: T) {
    super(client, {
      name: 'wallet',
      description: 'Wallet operations'
    });

    this.filePath = __filename;
  }

  get config() {
    return this.client.config.wallet;
  }

  async backup(filename?: string) {
    const wallet = fs.readFileSync(this.config.path, { encoding: 'utf-8' });
    if (!filename) {
      const d = new Date();
      const date = [
        d.getUTCFullYear(),
        d.getUTCMonth().toString().padStart(2, '0'),
        d.getUTCDay().toString().padStart(2, '0')
      ].join('-');
      const time = [
        d.getUTCHours().toString().padStart(2, '0'),
        d.getUTCMinutes().toString().padStart(2, '0'),
        d.getUTCSeconds().toString().padStart(2, '0'),
        d.getUTCMilliseconds().toString()
      ].join('-');
      filename = 'default_wallet.' + date + '_' + time + '.bak';
    }
    const backupPath = path.join(this.config.backupFolder, filename);
    const writer = new Writer(filename);
    await writer.write(wallet);
    this.logger.log(`Backed up wallet file: ${backupPath}`);
    this.lastBackup = Date.now();
  }
}
