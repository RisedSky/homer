const Event = require('../../Core/Structures/Event');
const { appendFile } = require('fs');
const { Util } = require('discord.js');
const moment = require('moment-timezone');

class GuildDelete extends Event {
  constructor(client) {
    super(client, 'guildDelete');
  }

  async handle(guild) {
    if (!guild.available) return;

    this.client.database.deleteDocument('guild', guild.id)
      .catch(() => {});

    appendFile(`${__dirname}/../../../logs/guilds.txt`, `[${Date.now()}] Leave - ${guild.name} (ID:${guild.id}) - Owner: ${guild.ownerID}\r\n`, (err) => {
      if (err) console.error(err);
    });

    const channel = this.client.channels.get(this.client.config.logChannels.guild);
    if (!channel) return;

    const formattedTime = moment().format('HH:mm:ss');
    channel.send(`\`[${formattedTime}]\` 📤 Left **${Util.escapeMarkdown(guild.name)}** (ID:${guild.id}) - Count: ${this.client.guilds.size}`);
  }
}

module.exports = GuildDelete;
