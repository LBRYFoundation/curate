module.exports = {
  // [string] The path where the commands will be found
  commandsPath: "./src/commands",

  // Dexare config
  dexare: {
    // [string] The token for the bot
    token: "",
    // [string] The prefix for the bot
    prefix: "c!",
    // [boolean?] Whether to use the bots mention as a prefix
    mentionPrefix: true,
    // [Array<string>] An array of elevated IDs, giving them access to developer commands
    elevated: [],
    // [number] The main embed color (#ffffff -> 0xffffff)
    embedColor: 0x15521c,
    // [string|Array<string>] The role ID(s) for curator roles
    curatorRoles: "",
    // [string|Array<string>] The role ID(s) for trusted roles
    trustedRoles: "",
    // [string|Array<string>] The role ID(s) for admin roles
    adminRoles: "",
    // [string] The ID of the main Discord guild
    guildID: "",


    // [Object] Eris client options (https://abal.moe/Eris/docs/Client)
    erisConfig: {
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
        "guildMessages",
        "guildMessageReactions",
        "directMessages",
        "directMessageReactions"
      ]
    },

    logger: {
      level: 'debug'
    },

    cron: {
      loadFolder: './src/crons'
    },

    lbry: {
      // [string] The SDK url to request from
      sdkURL: ""
    },

    lbryx: {
      // [string?] Amount to auto-fund upon account creation
      startingBalance: ""
    },

    wallet: {
      // [string] The ABSOLUTE path to the main wallet file to back up
      path: "~/.lbryum/wallets/default_wallet",
      // [string] The ABSOLUTE path folder to store wallet backups after every deletion
      backupFolder: "~/.lbryum_backup/",
    }
  }
}
