const Event = require('../../Core/Structures/Event');

class TypingStop extends Event {
  constructor(client) {
    super(client, 'typingStop');
  }

  async handle(channel) {
    if (channel.typing) return;

    const phoneCall = this.client.phone.calls.find(call =>
      call.state === 1 &&
      (call.sender === channel.id || call.receiver === channel.id));
    if (phoneCall) {
      const type = phoneCall.sender === channel.guild.id ? 'receiver' : 'sender';
      const targetGuild = this.client.guilds.get(phoneCall[type]);
      if (!targetGuild) return;

      const targetChannel = targetGuild.channels.get(
        await this.client.database.getDocument('guild', targetGuild.id).then(s => s.phone.channel),
      );

      targetChannel.stopTyping();
    }
  }
}

module.exports = TypingStop;