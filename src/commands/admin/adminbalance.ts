import { DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';

export default class AdminBalanceCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'adminbalance',
      description: 'Shows the master wallet balance.',
      category: 'Admin',
      aliases: ['abal', 'adminbal'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['adminbalance']
      }
    });

    this.filePath = __filename;
  }

  async run() {
    const wallet = await this.lbry.walletBalance();
    return this.displayWallet(wallet, 'Master Wallet Balance');
  }
}
