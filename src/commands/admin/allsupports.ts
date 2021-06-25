import { CommandContext, DexareClient } from 'dexare';
import { Support } from '../../modules/lbry/types';
import { GeneralCommand } from '../../util/abstracts';
import { paginate } from '../../util/pager';

export default class AllSupportsommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'allsupports',
      description: 'List all supports from all users.',
      category: 'Admin',
      aliases: ['asups', 'allsups'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['allsupports', 'allsupports @channel#a/video#b'],
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

    await this.lbryx.sync();
    const pairs = this.lbryx.getIDs();
    if (pairs.length <= 0) return 'No users found in the database.';

    const allSupports: (Support & {
      discordID: string;
      accountID: string;
    })[] = [];

    for (const [discordID, accountID] of pairs) {
      const supportsCount = await this.lbryx.getSupportsCount(accountID);
      if (supportsCount <= 0) continue;
      const supports = await this.lbry.supportList({
        account_id: accountID,
        page_size: supportsCount,
        claim_id: claim || undefined
      });
      for (const support of supports.items)
        allSupports.push({
          ...support,
          discordID,
          accountID
        });
    }

    if (allSupports.length <= 0) return 'No supports found.';

    await paginate(
      ctx,
      {
        title: 'Supports',
        items: allSupports.map(
          (item) => `> ${item.name} \`${item.claim_id}\`\n> <@${item.discordID}> ${item.amount} LBC`
        ),
        itemSeparator: '\n\n'
      },
      {
        author: { name: `All supports ${claim ? ` on claim \`${claim}\`` : ''}` }
      }
    );
  }
}
