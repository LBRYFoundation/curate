import { DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';

export default class SyncCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'sync',
      description: 'Syncs ID pairs with the SDK.',
      category: 'Admin',
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['sync']
      }
    });

    this.filePath = __filename;
  }

  async run() {
    const synced = await this.lbryx.sync();
    return `Synced ${synced.toLocaleString()} new pairs.`;
  }
}
