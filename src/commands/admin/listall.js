const Command = require('../../structures/Command');
const GenericPager = require('../../structures/GenericPager');

module.exports = class ListAll extends Command {
  get name() { return 'listall'; }
  get _options() { return {
    permissions: ['admin'],
    minimumArgs: 0
  }; }
  async exec(message) {
    const pairs = await this.client.sqlite.getAll();
    if (pairs <= 0)
      return message.channel.createMessage('No pairs found in the database.');

    for (const pair of pairs) {
      const response = await this.client.lbry.accountBalance(pair.lbryID);
      const wallet = await response.json();
      if (!wallet.code) {
        pair.wallet_available = wallet.result.available;
        pair.wallet_reserve = wallet.result.reserved_subtotals.supports;
        pair.wallet_ok = true;
      } else {
        console.error([
          'There was an error while retrieving the balance of an account.',
          'This was likely caused by an old version of the Bot\'s SQLite database file. ' +
          'Run the sync command to avoid this error!'
        ].join('\n'));
      }
    }

    const paginator = new GenericPager(this.client, message, {
      items: pairs, itemTitle: 'Pairs', itemsPerPage: 3,
      display: pair => `> <@${pair.discordID}> - \`${pair.lbryID}\`\n` +
      `> ${pair.wallet_ok
        ? `${pair.wallet_available} available, ${pair.wallet_reserve} staked.`
        : 'Wallet Unavailable'}\n`
    });
    return paginator.start(message.channel.id, message.author.id);
  }
  get metadata() { return {
    category: 'Admin',
    description: 'List all users in the database.'
  }; }
};
