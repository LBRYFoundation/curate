import { CommandContext, DexareClient } from 'dexare';
import { GeneralCommand } from '../../util/abstracts';
import { paginate } from '../../util/pager';

export default class TSupportsCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'tsupports',
      description: 'List supports from the trusted account.',
      category: 'Trusted',
      aliases: ['tsups'],
      userPermissions: ['lbry.trustedOrAdmin'],
      metadata: {
        examples: ['tsupports @channel#a/video#b'],
        usage: '[claim]'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    let claim: string | null = null;
    if (ctx.args[0]) {
      claim = await this.lbryx.resolveClaim(ctx.args[0]);
      if (!claim) return "That claim isn't valid.";
    }

    const accountID = await this.lbryx.getDefaultAccount();
    const supportsCount = await this.lbryx.getSupportsCount(accountID);
    if (supportsCount <= 0) return 'No supports found.';

    const supports = await this.lbry.supportList({
      account_id: accountID,
      page_size: supportsCount,
      claim_id: claim || undefined
    });

    await paginate(
      ctx,
      {
        items: supports.items.map((item) => `> ${item.name} \`${item.claim_id}\`\n> ${item.amount} LBC`),
        itemSeparator: '\n\n'
      },
      {
        author: { name: `All supports for the trusted account${claim ? ` on claim \`${claim}\`` : ''}` }
      }
    );
  }
}
