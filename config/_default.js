module.exports = {
  // [string] The token for the bot
  token: "",
  // [string] The prefix for the bot
  prefix: "L!",
  // [Array<string>] An array of elevated IDs, giving them access to developer commands
  elevated: [],
  // [string] The path where the commands will be found
  commandsPath: "./src/commands",
  // [boolean] Whether debug logs will be shown
  debug: false,
  // [number] The main embed color (#ffffff -> 0xffffff)
  embedColor: 0x429bce,
  // [string] curator_role_id
  curatorRoleID: "",
  // [string] admin_role_id
  adminRoleID: "",
  // [string] sdk_url
  sdkURL: "",
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
      "guildWebhooks",
      "guildMessages",
      "guildMessageReactions",
      "directMessages",
      "directMessageReactions"
    ] // 13865 - Intent Raw.
  }
}