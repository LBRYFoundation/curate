import { CommandContext, DexareClient } from 'dexare';
import { confirm, ensureDecimal, wait } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class FundAllCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'fundall',
      description: 'Fund all users in the database with some LBC.',
      category: 'Admin',
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['fundall 2.0'],
        usage: '<amount>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const amount = ensureDecimal(ctx.args[0]);
    if (!amount) return 'You must give a numeric amount of LBC to send!';

    await this.lbryx.sync();
    const pairs = this.lbryx.getIDs();

    // empty DB population
    if (pairs.length <= 0) {
      const procMsg = await ctx.reply('No users in the database, creating accounts...');
      await this.client.startTyping(ctx.channel.id);
      const rolesConfig: string | string[] = this.client.config.curatorRoles;
      const curatorRoles = Array.isArray(rolesConfig) ? rolesConfig : [rolesConfig];
      const members = await this.client.bot.guilds.get(this.client.config.guildID)!.fetchMembers();
      for (const member of members) {
        if (curatorRoles.map((r) => member.roles.includes(r)).includes(true)) {
          const account = await this.lbryx.ensureAccount(member.id);
          pairs.push([member.id, account.id]);
        }
      }
      await wait(5000);
      this.client.stopTyping(ctx.channel.id);
      await procMsg.delete().catch(() => {});
    }

    if (!(await confirm(ctx, `Are you sure you want to fund **all** accounts ${amount} LBC?`))) return;

    await this.client.startTyping(ctx.channel.id);
    const resultLines = [];
    let funded = 0,
      errored = 0;
    for (const [discordID, accountID] of pairs) {
      try {
        const transaction = await this.lbry.accountFund({ to_account: accountID, amount, broadcast: true });
        console.info('Funded account', accountID, transaction.txid);
        resultLines.push(`${discordID} - https://explorer.lbry.com/tx/${transaction.txid}`);
        funded++;
      } catch (e) {
        this.log('info', 'Failed to fund account', accountID, e);
        resultLines.push(`${discordID} ! ${e.toString()}`);
        errored++;
      }
      await wait(3000);
    }
    this.client.stopTyping(ctx.channel.id);

    await ctx.reply(
      errored
        ? `Failed to fund ${errored} accounts! (${funded} funded)`
        : `Successfully funded ${funded} account(s)!`,
      {
        name: 'result.txt',
        file: Buffer.from(resultLines.join('\n'), 'utf8')
      }
    );
  }
}
