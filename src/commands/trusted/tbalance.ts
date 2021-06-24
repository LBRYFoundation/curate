import { DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';

export default class TBalanceCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'tbalance',
      description: 'Shows the trusted account balance.',
      category: 'Trusted',
      aliases: ['tbal'],
      userPermissions: ['lbry.trustedOrAdmin'],
      metadata: {
        examples: ['tbalance']
      }
    });

    this.filePath = __filename;
  }

  async run() {
    const accountID = await this.lbryx.getDefaultAccount();
    const wallet = await this.lbry.accountBalance({ account_id: accountID });
    return this.displayWallet(wallet, 'Trusted Account Balance');
  }
}
