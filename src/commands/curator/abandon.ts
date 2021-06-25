import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';

export default class AbandonCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'abandon',
      description: 'Abandon a support on a claim.',
      category: 'Curator',
      aliases: ['aban', 'drop'],
      userPermissions: ['lbry.curatorOrAdmin'],
      metadata: {
        examples: ['abandon @channel#a/video#b'],
        usage: '<claim>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const claim = await this.lbryx.resolveClaim(ctx.args[0]);
    if (!claim) return "That claim isn't valid.";
    const account = await this.lbryx.ensureAccount(ctx.author.id);

    // Drop support
    const transaction = await this.lbry.supportAbandon({
      account_id: account.id,
      claim_id: claim
    });
    return stripIndents`
      Abandon successful!
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
