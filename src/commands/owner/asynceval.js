/* jshint evil: true */

const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class AsyncEval extends Command {
  get name() { return 'asynceval'; }

  get _options() { return {
    aliases: ['ae', 'aeval', 'aevaluate', 'asyncevaluate'],
    permissions: ['elevated'],
    listed: false,
  }; }

  // eslint-disable-next-line no-unused-vars
  async exec(message, opts) {
    try {
      const start = Date.now();
      const code = Util.Prefix.strip(message, this.client).split(' ').slice(1).join(' ');
      const result = await eval(`(async () => {${code}})()`);
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
    description: 'Evaluate code asynchronously.',
    usage: '<code>',
    note: 'Due to the added async IIFE wrapper in this command, ' +
      'it is necessary to use the return statement to return a result.\n' +
      'e.g. `return 1`'
  }; }
};
