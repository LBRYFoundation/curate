const Command = require('../structures/Command');
const Util = require('../util');
const config = require('config');

module.exports = class Help extends Command {
  get name() { return 'help'; }

  get _options() { return {
    aliases: [
      '?', 'h', 'commands', 'cmds', // English
      'yardim', 'yardım', 'komutlar', // Turkish
      'ayuda', // Spanish
      'ajuda' // Catalan & Portuguese
    ],
    permissions: ['embed'],
    cooldown: 0,
  }; }

  exec(message, { args, }) {
    if (args[0]) {
      // Display help on a command
      const command = this.client.cmds.get(args[0]);
      if (!command)
        return message.channel.createMessage(`The command \`${args[0]}\` could not be found.`);
      else {
        const embed = {
          title: `${config.prefix}${command.name}`,
          color: config.embedColor,
          fields: [
            { name: '*Usage*',
              value: `${config.prefix}${command.name}${
                command.metadata.usage ?
                  ` \`${command.metadata.usage}\`` : ''}` }
          ],
          description: command.metadata.description
        };

        // Cooldown
        if (command.options.cooldown)
          embed.fields.push({
            name: '*Cooldown*',
            value: `${command.options.cooldown.toLocaleString()} second(s)`,
            inline: false
          });

        // Aliases
        if (command.options.aliases.length !== 0) embed.fields.push({
          name: '*Alias(es)*',
          value: command.options.aliases.map(a => `\`${a}\``).join(', ')
        });

        // Image
        if (command.metadata.image)
          embed.image = { url: command.metadata.image };

        // Note
        if (command.metadata.note)
          embed.fields.push({
            name: '*Note*',
            value: command.metadata.note
          });

        return message.channel.createMessage({ embeds: [embed] });
      }
    } else {
      // Display general help command
      const embed = {
        color: config.embedColor,
        description: 'LBRY Curate',
        footer: { text: `\`${config.prefix}help [command]\` for more info.` },
        fields: []
      };

      // Populate categories
      const categories = {};
      this.client.cmds.commands.forEach(v => {
        if (!v.options.listed && !config.elevated.includes(message.author.id)) return;
        const string = v.name;
        if (categories[v.metadata.category])
          categories[v.metadata.category].push(string);
        else categories[v.metadata.category] = [string];
      });

      // List categories
      Util.keyValueForEach(categories, (k, v) => {
        embed.fields.push({
          name: `*${k}*`,
          value: '```' + v.join(', ') + '```',
          inline: true
        });
      });
      return message.channel.createMessage({ embeds: [embed] });
    }
  }

  get metadata() { return {
    category: 'General',
    description: 'Shows the help message and gives information on commands.',
    usage: '[command]'
  }; }
};
