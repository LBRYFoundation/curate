const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class DeleteAccount extends Command {
  get name() { return 'deleteaccount'; }

  get _options() { return {
    aliases: ['del', 'delacc'],
    permissions: ['admin'],
    minimumArgs: 1
  }; }

  async exec(message, { args }) {
    const discordID = Util.resolveToUserID(args[0]);
    if (!discordID)
      return message.channel.createMessage('That Discord user isn\'t valid.');
    const account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
    if (account.accountID) {
      const supportsCount = await Util.LBRY.getSupportsCount(this.client, account.accountID);
      if (!await this.client.messageAwaiter.confirm(message, {
        header:
          `Are you sure you want to delete that account? *(${supportsCount.toLocaleString()} support[s])*`
      })) return;
      try {
        await Util.LBRY.deleteAccount(this.client, discordID, account.accountID);
        return message.channel.createMessage('Deleted account.');
      } catch (e) {
        return message.channel.createMessage(
          'Failed to delete the account. An error most likely occured while backing up the wallet.' +
          `\n\`\`\`\n${e.toString()}\`\`\``
        );
      }
    } else
      return message.channel.createMessage('That user does not have an account.');
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Deletes a given Discord user\'s Curation account.',
    usage: '<id|@mention>'
  }; }
};
