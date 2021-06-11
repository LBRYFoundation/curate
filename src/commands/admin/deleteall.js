const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class DeleteAll extends Command {
  get name() { return 'deleteall'; }

  get _options() { return {
    aliases: ['delall'],
    permissions: ['admin'],
    minimumArgs: 0
  }; }

  async exec(message) {
    await Util.LBRY.syncPairs(this.client);
    const pairs = await this.client.sqlite.getAll();

    if (!await this.client.messageAwaiter.confirm(message, {
      header:
        `Are you sure you want to delete **all** ${pairs.length} accounts?`
    })) return;

    for (const pair of pairs) {
      try {
        await Util.LBRY.deleteAccount(this.client, pair.discordID, pair.lbryID);
      } catch (e) {
        return message.channel.createMessage(
          'Failed to delete an account. An error most likely occured while backing up the wallet.' +
          `\n\`\`\`\n${e.toString()}\`\`\``
        );
      }
    }
    return message.channel.createMessage('Deleted all accounts.');
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Deletes all accounts in the database.'
  }; }
};
