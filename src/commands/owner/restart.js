const Command = require('../../structures/Command');

module.exports = class Restart extends Command {
  get name() { return 'restart'; }

  get _options() { return {
    aliases: ['re'],
    permissions: ['elevated'],
    listed: false,
  }; }

  async exec(message) {
    await message.channel.createMessage('Restarting...');
    await this.client.dieGracefully();
    process.exit(0);
  }

  get metadata() { return {
    category: 'Developer',
    description: 'Restarts the bot.'
  }; }
};
