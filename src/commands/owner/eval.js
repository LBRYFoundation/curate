/* jshint evil: true */

const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Eval extends Command {
  get name() { return 'eval'; }

  get _options() { return {
    aliases: ['e'],
    permissions: ['elevated'],
    listed: false,
    minimumArgs: 1
  }; }

  // eslint-disable-next-line no-unused-vars
  async exec(message, opts) {
    try {
      const start = Date.now();
      const result = eval(Util.Prefix.strip(message, this.client).split(' ').slice(1).join(' '));
      const time = Date.now() - start;
      return Util.Hastebin.autosend(
        `Took ${time.toLocaleString()} ms\n\`\`\`js\n${result}\`\`\`\n`,
        message);
    } catch (e) {
      return Util.Hastebin.autosend('```js\n' + e.stack + '\n```', message);
    }
  }

  get metadata() { return {
    category: 'Developer',
    description: 'Evaluate code.',
    usage: '<code>'
  }; }
};
