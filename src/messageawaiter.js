const Halt = require('./structures/Halt');
const ReactionCollector = require('./structures/ReactionCollector');

/**
 * Handles async message functions
 */
class MessageAwaiter {
  constructor(client) {
    this.client = client;
    this.halts = new Map();
    this.reactionCollectors = new Map();
  }

  /**
   * Creates a halt. This pauses any events in the event handler for a specific channel and user.
   * This allows any async functions to handle any follow-up messages.
   * @param {string} channelID The channel's ID
   * @param {string} userID The user's ID
   * @param {number} [timeout=30000] The time until the halt is auto-cleared
   */
  createHalt(channelID, userID, timeout = 30000) {
    const id = `${channelID}:${userID}`;
    if (this.halts.has(id)) this.halts.get(id).end();
    const halt = new Halt(this, timeout);
    halt.once('end', () => this.halts.delete(id));
    this.halts.set(id, halt);
    return halt;
  }

  /**
   * Creates a reaction collector. Any reactions from the user will be emitted from the collector.
   * @param {string} message The message to collect from
   * @param {string} userID The user's ID
   * @param {number} [timeout=30000] The time until the halt is auto-cleared
   */
  createReactionCollector(message, userID, timeout = 30000) {
    const id = `${message.id}:${userID}`;
    if (this.reactionCollectors.has(id)) this.reactionCollectors.get(id).end();
    const collector = new ReactionCollector(this, timeout);
    collector.once('end', () => this.reactionCollectors.delete(id));
    this.reactionCollectors.set(id, collector);
    return collector;
  }

  /**
   * Gets an ongoing halt based on a message
   * @param {Message} message
   */
  getHalt(message) {
    const id = `${message.channel.id}:${message.author.id}`;
    return this.halts.get(id);
  }

  /**
   * Processes a halt based on a message
   * @param {Message} message
   */
  processHalt(message) {
    const id = `${message.channel.id}:${message.author.id}`;
    if (this.halts.has(id)) {
      const halt = this.halts.get(id);
      halt._onMessage(message);
      return true;
    }
    return false;
  }

  /**
   * Awaits the next message from a user
   * @param {Message} message The message to wait for
   * @param {Object} [options] The options for the await
   * @param {number} [options.filter] The message filter
   * @param {number} [options.timeout=30000] The timeout for the halt
   * @returns {?Message}
   */
  awaitMessage(message, { filter = () => true, timeout = 30000 } = {}) {
    return new Promise(resolve => {
      const halt = this.createHalt(message.channel.id, message.author.id, timeout);
      let foundMessage = null;
      halt.on('message', nextMessage => {
        if (filter(nextMessage)) {
          foundMessage = nextMessage;
          halt.end();
        }
      });
      halt.on('end', () => resolve(foundMessage));
    });
  }

  /**
   * Same as {@see #awaitMessage}, but is used for getting user input via next message
   * @param {Message} message The message to wait for
   * @param {Object} [options] The options for the await
   * @param {number} [options.filter] The message filter
   * @param {number} [options.timeout=30000] The timeout for the halt
   * @param {string} [options.header] The content to put in the bot message
   * @returns {?Message}
   */
  async getInput(message, { filter = () => true, timeout = 30000, header = null } = {}) {
    await message.channel.createMessage(`<@${message.author.id}>, ` +
      (header || 'Type the message you want to input.') + '\n\n' +
      `Typing "<@!${this.client.user.id}> cancel" will cancel the input.`);
    return new Promise(resolve => {
      const halt = this.createHalt(message.channel.id, message.author.id, timeout);
      let handled = false, input = null;
      halt.on('message', nextMessage => {
        if (filter(nextMessage)) {
          const cancelRegex = new RegExp(`^(?:<@!?${this.client.user.id}>\\s?)(cancel|stop|end)$`);

          if (!nextMessage.content || cancelRegex.test(nextMessage.content.toLowerCase())) {
            handled = true;
            message.channel.createMessage(`<@${message.author.id}>, Your last input was canceled.`);
          } else input = nextMessage.content;
          halt.end();
        }
      });
      halt.on('end', async () => {
        if (!input && !handled)
          await message.channel.createMessage(`<@${message.author.id}>, Your last input was canceled.`);
        resolve(input);
      });
    });
  }

  /**
   * Same as {@see #awaitMessage}, but is used for confirmation
   * @param {Message} message The message to wait for
   * @param {Object} [options] The options for the await
   * @param {number} [options.timeout=30000] The timeout for the halt
   * @param {string} [options.header] The content to put in the bot message
   * @returns {?Message}
   */
  async confirm(message, { timeout = 30000, header = null } = {}) {
    await message.channel.createMessage(`<@${message.author.id}>, ` +
      (header || 'Are you sure you want to do this?') + '\n\n' +
        'Type `yes` to confirm. Any other message will cancel the confirmation.');
    return new Promise(resolve => {
      const halt = this.createHalt(message.channel.id, message.author.id, timeout);
      let input = false;
      halt.on('message', nextMessage => {
        input = nextMessage.content === 'yes';
        halt.end();
      });
      halt.on('end', async () => {
        if (!input)
          await message.channel.createMessage(`<@${message.author.id}>, Confirmation canceled.`);
        resolve(input);
      });
    });
  }
}

MessageAwaiter.Halt = Halt;
module.exports = MessageAwaiter;