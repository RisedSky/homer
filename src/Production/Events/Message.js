const Event = require('../../Core/Structures/Event');
const Context = require('../../Core/Structures/Context');
const snekfetch = require('snekfetch');

class Message extends Event {
  constructor(client) {
    super(client, 'message');
  }

  async handle(message) {
    if (message.author.bot || !message.guild) return;

    /* We initiate the context for commands, etc. */
    const ctx = new Context(this.client, message);
    await ctx.getGuildSettings();

    /* We stop here if the channel has to be ignored */
    if (ctx.settings.data.ignoredChannels.includes(ctx.channel.id)) return;

    /* Handle Cleverbot */
    if (ctx.content.startsWith(`<@${this.client.user.id}>`) || ctx.content.startsWith(`<@${this.client.user.id}>`)) {
      const question = ctx.content.split(/ +/g).slice(1).join(' ');

      if (question) {
        ctx.channel.startTyping();

        snekfetch.post('http://cleverbot.io/1.0/ask')
          .send({
            user: this.client.config.api.cleverbotUser,
            key: this.client.config.api.cleverbotKey,
            nick: this.client.user.username,
            text: question,
          })
          .then(async (response) => {
            const parsed = response.body;
            if (parsed.status !== 'success') return ctx.channel.send(ctx.__('message.cleverbot.error', {
              errorIcon: this.client.constants.statusEmotes.error,
              message: parsed.status,
            }));

            await ctx.channel.send(parsed.response);
            ctx.channel.stopTyping();
          })
          .catch(async (response) => {
            const parsed = response.body;

            await ctx.channel.send(ctx.__('message.cleverbot.error', {
              errorIcon: this.client.constants.statusEmotes.error,
              message: parsed.status,
            }));
            ctx.channel.stopTyping(true);
          });
      }
    }

    /* Commands handling */
    const prefix = ctx.isCommand();
    if (!prefix) return;

    const args = ctx.content.split(/ +/g);
    const command = args.shift().slice(prefix.length).toLowerCase();

    const cmdFile = this.client.commands.getCommand(command);
    if (cmdFile) {
      const cmd = new cmdFile(this.client);

      if (cmd.private) {
        if (!this.client.config.owners.includes(ctx.author.id)) return;
      }

      for (const permission of cmd.botPermissions) {
        if (!ctx.guild.me.permissions.has(permission)) return;
      }

      for (const permission of cmd.userPermissions) {
        if (!ctx.member.permissions.has(permission)) return;
      }

      cmd.run(ctx);
    }
  }
}

module.exports = Message;