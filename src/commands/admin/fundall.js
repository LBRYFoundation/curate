const Command = require('../../structures/Command');
const Util = require('../../util');
const config = require('config');

module.exports = class FundAll extends Command {
  get name() { return 'fundall'; }

  get _options() { return {
    permissions: ['admin'],
    minimumArgs: 1
  }; }

  async exec(message, { args }) {
    const givenAmount = Util.LBRY.ensureDecimal(args[0]);
    if (!givenAmount)
      return message.channel.createMessage('The second argument must be a numeric amount of LBC to send!');

    await Util.LBRY.syncPairs(this.client);
    const pairs = await this.client.sqlite.getAll();
    if (pairs.length <= 0) {
      await this.client.startTyping(message.channel);
      const curatorRoles = Array.isArray(config.curatorRoleID)
        ? config.curatorRoleID : [config.curatorRoleID];
      const members = await this.client.guilds.get(config.guildID).fetchMembers();
      for (const member of members) {
        if (curatorRoles.map(r => member.roles.includes(r)).includes(true)) {
          const account = await Util.LBRY.findOrCreateAccount(this.client, member.id);
          pairs.push({ discordID: member.id, lbryID: account.accountID });
        }
      }
      await Util.halt(5000);
      this.client.stopTyping(message.channel);
    }

    if (!await this.client.messageAwaiter.confirm(message, {
      header: `Are you sure you want to fund **all** accounts? *(${givenAmount} LBC)*`
    })) return;

    await this.client.startTyping(message.channel);
    const resultLines = [];
    let funded = 0,
      errored = 0;
    for (const pair of pairs) {
      const response = await this.client.lbry.fundAccount({ to: pair.lbryID, amount: givenAmount });
      await Util.halt(2000);
      const transaction = await response.json();
      if ('code' in transaction) {
        console.info('Failed to fund account', pair.lbryID, transaction.code, transaction.message);
        resultLines.push(`${pair.discordID} ! ${transaction.code} - ${transaction.message}`);
        errored++;
      } else {
        console.info('Funded account', pair.lbryID, transaction.result.txid);
        resultLines.push(`${pair.discordID} - https://explorer.lbry.com/tx/${transaction.result.txid}`);
        funded++;
      }
      await Util.halt(2000);
    }
    this.client.stopTyping(message.channel);
    return message.channel.createMessage(errored
      ? `Failed to fund ${errored} accounts! (${funded} funded)`
      : `Successfully funded ${funded} account(s)!`, {
      name: 'result.txt',
      file: Buffer.from(resultLines.join('\n'), 'utf8')
    });
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Funds all users in the database a specified amount of LBC.',
    usage: '<amount>'
  }; }
};
