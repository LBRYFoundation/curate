const Command = require('../../structures/Command');

module.exports = class Reload extends Command {
  get name() { return 'reload'; }

  get _options() { return {
    aliases: ['r'],
    permissions: ['elevated'],
    listed: false,
  }; }

  async exec(message) {
    const sentMessage = await message.channel.createMessage('♻️ Reloading commands…');
    this.client.cmds.reload();
    this.client.cmds.preloadAll();
    return sentMessage.edit('✅ Reloaded commands.');
  }

  get metadata() { return {
    category: 'Developer',
    description: 'Reloads all commands.'
  }; }
};
