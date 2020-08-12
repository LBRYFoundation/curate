const Eris = require('eris');
const Database = require('./database');
const EventHandler = require('./events');
const CommandLoader = require('./commandloader');
const MessageAwaiter = require('./messageawaiter');
const path = require('path');
const CatLoggr = require('cat-loggr');
const config = require('config');

class CurateBot extends Eris.Client {
  constructor({ packagePath, mainDir } = {}) {
    // Initialization
    const pkg = require(packagePath || `${mainDir}/package.json`);
    super(config.token, JSON.parse(JSON.stringify(config.discordConfig)));
    this.dir = mainDir;
    this.pkg = pkg;
    this.logger = new CatLoggr({
      level: config.debug ? 'debug' : 'info',
      levels: [
        { name: 'fatal', color: CatLoggr._chalk.red.bgBlack, err: true },
        { name: 'error', color: CatLoggr._chalk.black.bgRed, err: true },
        { name: 'warn', color: CatLoggr._chalk.black.bgYellow, err: true },
        { name: 'init', color: CatLoggr._chalk.black.bgGreen },
        { name: 'webserv', color: CatLoggr._chalk.black.bgBlue },
        { name: 'info', color: CatLoggr._chalk.black.bgCyan },
        { name: 'assert', color: CatLoggr._chalk.cyan.bgBlack },
        { name: 'poster', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'debug', color: CatLoggr._chalk.magenta.bgBlack, aliases: ['log', 'dir'] },
        { name: 'limiter', color: CatLoggr._chalk.gray.bgBlack },
        { name: 'fileload', color: CatLoggr._chalk.white.bgBlack }
      ]
    });
    this.logger.setGlobal();
    this.typingIntervals = new Map();

    // Events
    this.on('ready', () => console.info('All shards ready.'));
    this.on('disconnect', () => console.warn('All shards Disconnected.'));
    this.on('reconnecting', () => console.warn('Reconnecting client.'));
    this.on('debug', message => console.debug(message));

    // Shard Events
    this.on('connect', id => console.info(`Shard ${id} connected.`));
    this.on('error', (error, id) => console.error(`Error in shard ${id}`, error));
    this.on('hello', (_, id) => console.debug(`Shard ${id} recieved hello.`));
    this.on('warn', (message, id) => console.warn(`Warning in Shard ${id}`, message));
    this.on('shardReady', id => console.info(`Shard ${id} ready.`));
    this.on('shardResume', id => console.warn(`Shard ${id} resumed.`));
    this.on('shardDisconnect', (error, id) => console.warn(`Shard ${id} disconnected`, error));

    // SIGINT & uncaught exceptions
    process.once('uncaughtException', async err => {
      console.error('Uncaught Exception', err.stack);
      await this.dieGracefully();
      process.exit(0);
    });

    process.once('SIGINT', async () => {
      console.info('Caught SIGINT');
      await this.dieGracefully();
      process.exit(0);
    });

    console.init('Client initialized');
  }

  /**
   * Creates a promise that resolves on the next event
   * @param {string} event The event to wait for
   */
  waitTill(event) {
    return new Promise(resolve => this.once(event, resolve));
  }

  /**
   * Starts the processes and log-in to Discord.
   */
  async start() {
    // Redis
    this.db = new Database(this);
    await this.db.connect(config.redis);

    // Discord
    await this.connect();
    await this.waitTill('ready');
    this.editStatus('online', {
      name: `${config.prefix}help`,
      type: 3,
    });

    // Commands
    this.cmds = new CommandLoader(this, path.join(this.dir, config.commandsPath));
    this.cmds.reload();
    this.cmds.preloadAll();

    // Events
    this.messageAwaiter = new MessageAwaiter(this);
    this.eventHandler = new EventHandler(this);
  }

  /**
   * KIlls the bot
   */
  dieGracefully() {
    return super.disconnect();
  }

  // Typing

  /**
   * Start typing in a channel
   * @param {Channel} channel The channel to start typing in
   */
  async startTyping(channel) {
    if (this.isTyping(channel)) return;
    await channel.sendTyping();
    this.typingIntervals.set(channel.id, setInterval(() => {
      channel.sendTyping().catch(() => this.stopTyping(channel));
    }, 5000));
  }

  /**
   * Whether the bot is currently typing in a channel
   * @param {Channel} channel
   */
  isTyping(channel) {
    return this.typingIntervals.has(channel.id);
  }

  /**
   * Stops typing in a channel
   * @param {Channel} channel
   */
  stopTyping(channel) {
    if (!this.isTyping(channel)) return;
    const interval = this.typingIntervals.get(channel.id);
    clearInterval(interval);
    this.typingIntervals.delete(channel.id);
  }
}

const Bot = new CurateBot({ mainDir: path.join(__dirname, '..') });
Bot.start().catch(e => {
  Bot.logger.error('Failed to start bot! Exiting in 10 seconds...');
  console.error(e);
  setTimeout(() => process.exit(0), 10000);
});
