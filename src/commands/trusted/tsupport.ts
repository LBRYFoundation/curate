import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { ensureDecimal, confirm } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class TSupportCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'tsupport',
      description: 'Support a claim from the trusted account.',
      category: 'Trusted',
      aliases: ['tsup'],
      userPermissions: ['lbry.trusted'],
      metadata: {
        examples: ['tsupport @channel#a/video#b 2.0'],
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
    const accountID = await this.lbryx.getDefaultAccount();

    // Check if the balance is more than requested
    const balance = await this.lbry.accountBalance({ account_id: accountID });
    const availableBalance = parseFloat(balance.available);
    if (parseFloat(amount) > availableBalance)
      return 'There is not enough available LBC in the account to fund that amount!';

    if (!(await confirm(ctx, 'Are you sure you want to support a claim from a **trusted** account?'))) return;

    // Create support
    const transaction = await this.lbry.supportCreate({
      account_id: accountID,
      funding_account_ids: [accountID],
      claim_id: claim,
      amount
    });
    return stripIndents`
      Support created!
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
