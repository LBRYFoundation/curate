const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Fund extends Command {
  get name() { return 'fund'; }

  get _options() { return {
    aliases: ['fundacc', 'fundaccount'],
    permissions: ['admin'],
    minimumArgs: 2
  }; }

  async exec(message, { args }) {
    const givenAmount = Util.LBRY.ensureDecimal(args[1]);
    if (!givenAmount)
      return message.channel.createMessage('The second argument must be a numeric amount of LBC to send!');

    const discordID = Util.resolveToUserID(args[0]);
    if (!discordID)
      return message.channel.createMessage('That Discord user isn\'t valid.');

    const account = await Util.LBRY.findOrCreateAccount(this.client, discordID, true);
    if (!await this.client.messageAwaiter.confirm(message, {
      header: `Are you sure you want to fund this account? *(${givenAmount} LBC)*`
    })) return;
    const response = await this.client.lbry.fundAccount({ to: account.accountID, amount: givenAmount });
    const transaction = await response.json();
    console.info('Funded account', account.accountID, transaction.result.txid);
    const txid = transaction.result.txid;
    return message.channel.createMessage(`Successfully funded account! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Funds a given Discord user\'s Curation account with the specified amount of LBC.',
    usage: '<id|@mention> <amount>'
  }; }
};
