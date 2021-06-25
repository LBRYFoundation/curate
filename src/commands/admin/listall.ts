import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { Balance } from '../../modules/lbry/types';
import { GeneralCommand } from '../../util/abstracts';
import { paginate } from '../../util/pager';

export default class ListAllCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'listall',
      description: 'List all users in the database.',
      category: 'Admin',
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['listall', 'listall 2'],
        usage: '[page]'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const pairs = this.lbryx.getIDs();
    const walletMap = new Map<string, Balance>();

    for (const [, accountID] of pairs) {
      try {
        const wallet = await this.lbry.accountBalance({ account_id: accountID });
        walletMap.set(accountID, wallet);
      } catch (e) {}
    }

    await paginate(ctx, {
      title: 'Users',
      items: pairs.map(([discordID, accountID]) => {
        const bal = walletMap.get(accountID);
        return stripIndents`
          > <@${discordID}> - \`${accountID}\`
          > ${
            bal
              ? `${bal.available} available, ${bal.reserved_subtotals.supports} staked.`
              : 'Wallet Unavailable'
          }
        `;
      }),
      itemSeparator: '\n\n',
      startPage: parseInt(ctx.args[0])
    });
  }
}
