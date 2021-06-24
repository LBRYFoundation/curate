import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class TAbandonCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'tabandon',
      description: 'Abandon a support on a claim from the trusted account.',
      category: 'Trusted',
      aliases: ['taban', 'tdrop'],
      userPermissions: ['lbry.trustedOrAdmin'],
      metadata: {
        examples: ['tabandon @channel#a/video#b'],
        usage: '<claim>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const claim = await this.lbryx.resolveClaim(ctx.args[0]);
    if (!claim) return "That claim isn't valid.";
    const accountID = await this.lbryx.getDefaultAccount();

    if (!(await confirm(ctx, 'Are you sure you want to abandon a claim from a **trusted** account?'))) return;

    // Drop support
    const transaction = await this.lbry.supportAbandon({
      account_id: accountID,
      claim_id: claim
    });
    return stripIndents`
      Abandon successful!
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
