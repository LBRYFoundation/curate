import { CommandContext, DexareClient } from 'dexare';
import { EnsureAccountResult } from '../../modules/lbryx';
import { resolveUser } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class BalanceCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'balance',
      description: 'Shows your account balance.',
      category: 'Curator',
      aliases: ['bal'],
      userPermissions: ['lbry.curator'],
      metadata: {
        examples: ['balance', 'balance @user'],
        usage: '<user>',
        details: 'Only LBRY Admins can use this command to check the balance of others.'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const isAdmin = this.client.permissions.has({ user: ctx.author }, 'lbry.admin');

    let username = ctx.author.username,
      account: EnsureAccountResult,
      other = false;
    if (isAdmin && ctx.args[0]) {
      const userID = resolveUser(ctx.args[0]);
      if (!userID) return "That Discord user isn't valid.";
      const member = (await ctx.guild!.fetchMembers({ userIDs: [userID] }))[0];
      username = member ? member.username : userID;
      account = await this.lbryx.ensureAccount(userID, false);
      if (!account.id) return 'That Discord user does not have an account.';
      other = true;
    } else account = await this.lbryx.ensureAccount(ctx.author.id);

    const wallet = await this.lbry.accountBalance({ account_id: account.id });
    return this.displayWallet(wallet, other ? `${username}'s Account Balance` : 'Your Account Balance', {
      newAccount: account.new
    });
  }
}
