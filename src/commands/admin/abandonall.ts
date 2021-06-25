import { oneLine } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm, resolveUser } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class AbandonAllCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'abandonall',
      description: 'Abandons all supports of all accounts or of a given account.',
      category: 'Admin',
      aliases: ['abanall', 'dropall'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['abandonall', 'abandonall @user'],
        usage: '[user]'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    // Single user abandon
    if (ctx.args[0]) {
      const discordID = resolveUser(ctx.args[0]);
      if (!discordID) return "That Discord user isn't valid.";

      const account = await this.lbryx.ensureAccount(discordID, false);
      if (!account.id) return 'That user does not have an account.';

      const supportsCount = await this.lbryx.getSupportsCount(account.id);
      if (supportsCount <= 0) return 'That user does not have any supports.';

      if (
        !(await confirm(
          ctx,
          oneLine`
            Are you sure you want to abandon **all supports** from that account?
            *(${supportsCount.toLocaleString()} support[s])*
          `
        ))
      )
        return;
      await this.lbryx.abandonAllClaims(account.id);
      return `Abandoned ${supportsCount.toLocaleString()} support(s).`;
    }

    // Abandon ALL supports

    await this.lbryx.sync();
    const pairs = this.lbryx.getIDs();
    if (pairs.length <= 0) return 'No pairs in the database.';

    if (!(await confirm(ctx, 'Are you sure you want to abandon **all supports** from **all accounts**?')))
      return;

    await this.client.startTyping(ctx.channel.id);
    let count = 0;
    for (const [, lbryID] of pairs) {
      const result = await this.lbryx.abandonAllClaims(lbryID);
      if (result) count += result.count;
    }
    this.client.stopTyping(ctx.channel.id);
    return `Abandoned ${count.toLocaleString()} supports(s).`;
  }
}
