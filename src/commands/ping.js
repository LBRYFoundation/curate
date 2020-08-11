const Command = require('../structures/Command');

module.exports = class Ping extends Command {
  get name() { return 'ping'; }

  get _options() { return {
    aliases: ['p', 'pong'],
    cooldown: 0,
  }; }

  async exec(message) {
    const currentPing = Array.from(this.client.shards.values())
      .map(shard => shard.latency).reduce((prev, val) => prev + val, 0);
    const timeBeforeMessage = Date.now();
    const sentMessage = await message.channel.createMessage('> :ping_pong: ***Ping...***\n' +
      `> WS: ${currentPing.toLocaleString()} ms`);
    await sentMessage.edit(
      '> :ping_pong: ***Pong!***\n' +
      `> WS: ${currentPing.toLocaleString()} ms\n` +
      `> REST: ${(Date.now() - timeBeforeMessage).toLocaleString()} ms`);
  }

  get metadata() { return {
    category: 'General',
    description: 'Pong!'
  }; }
};
