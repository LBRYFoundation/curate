const ArgumentInterpreter = require('./structures/ArgumentInterpreter');
const Util = require('./util');
const config = require('config');

module.exports = class Events {
  constructor(client) {
    this.client = client;
    client.on('messageCreate', this.onMessage.bind(this));
    client.on('messageReactionAdd', this.onReaction.bind(this));
  }

  async onMessage(message) {
    if (message.author.bot || message.author.system) return;

    // Check to see if bot can send messages
    if (message.channel.type !== 1 &&
      !message.channel.permissionsOf(this.client.user.id).has('SEND_MESSAGES')) return;

    // Message awaiter
    if (this.client.messageAwaiter.processHalt(message)) return;

    // Command parsing
    const argInterpretor = new ArgumentInterpreter(Util.Prefix.strip(message, this.client));
    const args = argInterpretor.parseAsStrings();
    const commandName = args.splice(0, 1)[0];
    const command = this.client.cmds.get(commandName, message);
    if (!message.content.match(Util.Prefix.regex(this.client)) || !command) return;

    try {
      await command._exec(message, {
        args
      });
    } catch (e) {
      if (config.debug) {
        console.error(`The '${command.name}' command failed.`);
        console.log(e);
      }
      message.channel.createMessage(':fire: An error occurred while processing that command!');
      this.client.stopTyping(message.channel);
    }
  }

  onReaction(message, emoji, member) {
    const id = `${message.id}:${member.id}`;
    if (this.client.messageAwaiter.reactionCollectors.has(id)) {
      const collector = this.client.messageAwaiter.reactionCollectors.get(id);
      collector._onReaction(emoji, member.id);
    }
  }
};
