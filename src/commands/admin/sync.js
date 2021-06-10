const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Sync extends Command {
  get name() { return 'sync'; }

  get _options() { return {
    permissions: ['admin']
  }; }

  async exec(message) {
    const synced = await Util.LBRY.syncPairs(this.client);
    return message.channel.createMessage(`Synced ${synced} new pairs.`);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Sync SDK-Discord pairs.'
  }; }
};
