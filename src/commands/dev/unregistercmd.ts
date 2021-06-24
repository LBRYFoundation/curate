import { DexareClient, DexareCommand, CommandContext } from 'dexare';

export default class UnregisterCmdCommand extends DexareCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'unregistercmd',
      aliases: ['unregcmd'],
      description: 'Unregisters commands.',
      category: 'Developer',
      userPermissions: ['dexare.elevated'],
      metadata: {
        examples: ['unregistercmd ping'],
        usage: '<commandName> [commandName] ...'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.length) return 'Please define commands(s) you want to unload.';

    for (const arg of ctx.args) {
      if (!this.client.commands.commands.has(arg)) return `The command \`${arg}\` does not exist.`;
      this.client.commands.unregister(this.client.commands.commands.get(arg)!);
    }

    return `Unregistered ${ctx.args.length.toLocaleString()} command(s).`;
  }
}
