import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { ensureDecimal, wait } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class SupportCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'support',
      description: 'Support a claim.',
      category: 'Curator',
      aliases: ['sup'],
      userPermissions: ['lbry.curator'],
      metadata: {
        examples: ['support @channel#a/video#b 2.0'],
        usage: '<claim> <amount>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const claim = await this.lbryx.resolveClaim(ctx.args[0]);
    if (!claim) return "That claim isn't valid.";
    const amount = ensureDecimal(ctx.args[1]);
    if (!amount) return 'You must give a numeric amount of LBC to send!';

    const account = await this.lbryx.ensureAccount(ctx.author.id);
    if (account.new) await wait(3000);

    // Check if the balance is more than requested
    const balance = await this.lbry.accountBalance({ account_id: account.id });
    const availableBalance = parseFloat(balance.available);
    if (parseFloat(amount) > availableBalance)
      return 'There is not enough available LBC in the account to fund that amount!';

    // Create support
    const transaction = await this.lbry.supportCreate({
      account_id: account.id,
      funding_account_ids: [account.id],
      claim_id: claim,
      amount
    });
    return stripIndents`
      Support created!
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
