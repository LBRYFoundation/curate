module.exports = {
  // [string] The token for the bot
  token: "",
  // [string] The prefix for the bot
  prefix: "!",
  // [Array<string>] An array of elevated IDs, giving them access to developer commands
  elevated: [],
  // [string] The path where the commands will be found
  commandsPath: "./src/commands",
  // [boolean] Whether debug logs will be shown
  debug: false,
  // [number] The main embed color (#ffffff -> 0xffffff)
  embedColor: 0x15521c,
  // [string|Array<string>] The role ID(s) for curator roles
  curatorRoleID: "",
  // [string|Array<string>] The role ID(s) for trusted roles
  trustedRoleID: "",
  // [string|Array<string>] The role ID(s) for admin roles
  adminRoleID: "",
  // [string] guild_id
  guildID: "",
  // [string] sdk_url
  sdkURL: "",
  // [string] The ABSOLUTE path to the main wallet file to back up
  walletPath: "~/.lbryum/wallets/default_wallet",
  // [string] The ABSOLUTE path folder to store wallet backups after every deletion
  walletBackupFolder: "~/.lbryum_backup/",
  // [string] Amount to auto-fund upon account creation
  startingBalance: "",
  // [Object] Eris client options (https://abal.moe/Eris/docs/Client)
  discordConfig: {
    autoreconnect: true,
    allowedMentions: {
      everyone: false,
      roles: false,
      users: true
    },
    maxShards: "auto",
    messageLimit: 0,
    intents: [
      "guilds",
      "guildEmojis",
      "guildMessages",
      "guildMessageReactions",
      "directMessages",
      "directMessageReactions"
    ]
  },
  // [Object] Redis config
  redis: {
    host: "localhost",
    port: 6379,
    password: "",
    prefix: "lbrycurate:"
  }
}