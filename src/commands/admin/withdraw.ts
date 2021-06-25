import { oneLine, stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm, ensureDecimal } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class WithdrawCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'withdraw',
      description: 'Sends funds to an address from the master wallet.',
      category: 'Admin',
      aliases: ['wd'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['wd abcd1234 2.0']
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const addr = ctx.args[0];
    if (!addr || !/^[\w]{34}$/.test(addr)) return 'The address is invalid!';
    const amount = ensureDecimal(ctx.args[1]);
    if (!amount) return 'You must give a numeric amount of LBC to send!';

    // Check if the balance is more than requested
    const balance = await this.lbry.walletBalance();
    const availableBalance = parseFloat(balance.available);
    if (parseFloat(amount) > availableBalance)
      return 'There is not enough available LBC in the wallet to send that amount!';

    // Send to wallet
    if (
      !(await confirm(
        ctx,
        oneLine`
          Are you sure you want to send ${amount} to \`${addr}\`?
          *(remaining: ${availableBalance - parseFloat(amount)})*
        `
      ))
    )
      return;

    const transaction = await this.lbry.walletSend({ amount, addresses: addr });
    this.log('info', `Withdrew ${amount} from master wallet to ${addr}`, transaction);
    return stripIndents`
      Sent ${amount} LBC to \`${addr}\`.
      🔗 https://explorer.lbry.com/tx/${transaction.txid}
    `;
  }
}
