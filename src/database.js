const { default: Redis } = require('ioredis');
const { EventEmitter } = require('eventemitter3');

/**
 * The Redis database handler
 */
module.exports = class Database extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this.reconnectAfterClose = true;
    console.init('Redis initialized');
  }

  /**
   * Creates a client and connects to the database
   * @param {Object} options
   */
  connect({ host = 'localhost', port, password, prefix }) {
    console.info('Connecting to redis...');
    return new Promise((resolve, reject) => {
      this.redis = new Redis(port, host, { password, keyPrefix: prefix });
      this.redis.on('error', this.onError.bind(this));
      this.redis.on('warning', w => console.warn('Redis Warning', w));
      this.redis.on('end', () => this.onClose.bind(this));
      this.redis.on('reconnecting', () => console.warn('Reconnecting to redis...'));
      this.redis.on('ready', () => console.info('Redis client ready.'));
      this.redis.on('connect', () => console.info('Redis connection has started.'));
      this.host = host;
      this.port = port;
      this.password = password;

      this.redis.once('ready', resolve.bind(this));
      this.redis.once('error', reject.bind(this));
    });
  }

  // #region Redis functions
  hget(key, hashkey) {
    return this.redis.hget(key, hashkey);
  }

  hset(key, hashkey, value) {
    return this.redis.hset(key, hashkey, value);
  }

  incr(key) {
    return this.redis.incr(key);
  }

  get(key) {
    return this.redis.get(key);
  }

  expire(key, ttl) {
    return this.redis.expire(key, ttl);
  }


  exists(key) {
    return this.redis.exists(key);
  }

  set(key, value) {
    return this.redis.set(key, value);
  }
  // #endregion

  /**
   * Reconnects the client
   */
  async reconnect() {
    console.warn('Attempting redis reconnection');
    this.conn = await this.connect(this);
  }

  /**
   * Disconnects the client
   */
  disconnect() {
    this.reconnectAfterClose = false;
    return new Promise(resolve => {
      this.redis.once('end', resolve);
      this.redis.quit();
    });
  }

  /**
   * @private
   */
  onError(err) {
    console.error('Redis Error', err);
    this.emit('error', err);
  }

  /**
   * @private
   */
  async onClose() {
    console.error('Redis closed');
    this.emit('close');
    if (this.reconnectAfterClose) await this.reconnect();
  }
};
