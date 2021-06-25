import { CommandContext, DexareClient } from 'dexare';
import { EnsureAccountResult } from '../../modules/lbryx';
import { resolveUser } from '../../util';
import { GeneralCommand } from '../../util/abstracts';
import { paginate } from '../../util/pager';

export default class SupportsCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'supports',
      description: 'List supports.',
      category: 'Curator',
      aliases: ['sups'],
      userPermissions: ['lbry.curator'],
      metadata: {
        examples: ['supports', 'supports @user', 'supports @user @channel#a/video#b'],
        usage: '[user] [claim]'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    let claim: string | null = null,
      username = ctx.author.username,
      account: EnsureAccountResult;
    if (ctx.args[0]) {
      const userID = resolveUser(ctx.args[0]);
      if (!userID) return "That Discord user isn't valid.";
      const member = (await ctx.guild!.fetchMembers({ userIDs: [userID] }))[0];
      username = member ? member.username : userID;
      account = await this.lbryx.ensureAccount(userID, false);
      if (!account.id) return 'That Discord user does not have an account.';
    } else account = await this.lbryx.ensureAccount(ctx.author.id);

    if (ctx.args[1]) {
      claim = await this.lbryx.resolveClaim(ctx.args[1]);
      if (!claim) return "That claim isn't valid.";
    }

    const accountID = await this.lbryx.getDefaultAccount();
    const supportsCount = await this.lbryx.getSupportsCount(accountID);
    if (supportsCount <= 0) return 'No supports found.';

    const supports = await this.lbry.supportList({
      account_id: account.id,
      page_size: supportsCount,
      claim_id: claim || undefined
    });

    await paginate(
      ctx,
      {
        title: 'Supports',
        items: supports.items.map((item) => `> ${item.name} \`${item.claim_id}\`\n> ${item.amount} LBC`),
        itemSeparator: '\n\n'
      },
      {
        author: { name: `All supports by ${username}${claim ? ` on claim \`${claim}\`` : ''}` }
      }
    );
  }
}
