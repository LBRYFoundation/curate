import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm, ensureDecimal, resolveUser } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class FundCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'fund',
      description: "Fund a user's account with some LBC.",
      category: 'Admin',
      aliases: ['fundacc', 'fundaccount'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['fund @user 2.0'],
        usage: '<user> <amount>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const discordID = resolveUser(ctx.args[0]);
    if (!discordID) return "That Discord user isn't valid.";
    const account = await this.lbryx.ensureAccount(discordID, false);
    if (!account.id) return 'That user does not have an account.';
    const amount = ensureDecimal(ctx.args[1]);
    if (!amount) return 'You must give a numeric amount of LBC to send!';

    if (!(await confirm(ctx, `Are you sure you want to fund this account ${amount} LBC?`))) return;

    const transaction = await this.lbry.accountFund({ amount, to_account: account.id, broadcast: true });
    this.log('info', `Funded account ${account.id} ${amount}`, transaction);
    return stripIndents`
      Successfully funded account!
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
