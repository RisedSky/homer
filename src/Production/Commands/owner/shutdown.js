const Command = require('../../../Core/Structures/Command');

class Shutdown extends Command {
  constructor(client) {
    super(client, {
      name: 'shutdown',
      aliases: ['reboot'],
      category: 'owner',
      private: true,
    });
  }

  async run(ctx) {
    const msg = await ctx.channel.send(`${this.client.constants.botEmote} Stopping services...`);
    await this.client.dashboard.shutdown();
    this.client.removeAllListeners();
    await this.client.database.provider.getPoolMaster().drain();
    await msg.edit(`${this.client.constants.botEmote} Services stopped! Goodbye.`);
    this.client.destroy().then(() => process.exit(ctx.args[0] === 'reboot' ? 1 : 0));
  }
}

module.exports = Shutdown;
