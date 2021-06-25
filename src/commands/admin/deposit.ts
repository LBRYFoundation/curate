import { DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';

export default class DepositCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'deposit',
      description: 'Gets the address of the master wallet.',
      category: 'Admin',
      aliases: ['dp'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['deposit']
      }
    });

    this.filePath = __filename;
  }

  async run() {
    const accountID = await this.lbryx.getDefaultAccount();
    const addresses = await this.lbry.addressList({ account_id: accountID, page_size: 1 });
    return `Address: ${addresses.items[0].address}`;
  }
}
