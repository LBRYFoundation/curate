const Command = require('../../structures/Command');
const fs = require('fs');

module.exports = class ReloadOne extends Command {
  get name() { return 'reloadone'; }

  get _options() { return {
    aliases: ['r1', 'reloadsingle', 'rs'],
    permissions: ['elevated'],
    minimumArgs: 1,
    listed: false,
  }; }

  async exec(message, { args }) {
    const commands = args.map(name => this.client.cmds.get(name));
    if (commands.includes(undefined))
      return message.channel.createMessage('Invalid command!');

    const fileExist = commands.map(command => {
      const path = command.path;
      const stat = fs.lstatSync(path);
      return stat.isFile();
    });

    if (fileExist.includes(false))
      return message.channel.createMessage('A file that had a specified command no longer exists!');

    const sentMessage = await message.channel.createMessage('♻️ Reloading commands…');

    const reloadedCommands = commands.map(command => {
      const path = command.path;
      const index = this.client.cmds.commands.indexOf(command);
      this.client.cmds.commands.splice(index, 1);
      const newCommand = this.client.cmds.load(path);
      newCommand.preload();
      return newCommand;
    });
    return sentMessage.edit(`✅ Reloaded ${reloadedCommands.map(c => `\`${c.name}\``).join(', ')}.`);
  }

  get metadata() { return {
    category: 'Developer',
    description: 'Reloads specific commands.',
    usage: '<commandName> [commandName] …'
  }; }
};
