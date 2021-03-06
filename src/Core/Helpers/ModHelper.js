const Helper = require('./Helper');
const i18n = require('i18n');
const mtz = require('moment-timezone');

/**
 * Represents a mod helper.
 * @extends {Helper}
 */
class ModHelper extends Helper {
  /**
   * Register a moderation case.
   * @param {String} guild Guild ID
   * @param {Number} action Action identifier
   * @param {String} author Action author ID
   * @param {String} target User or channel ID
   * @param {String} reason Reason
   * @param {Object} extra Extra stuff (mostly used by the translation module)
   */
  async registerCase(guild, action, author, target, reason, extra = {}) {
    const settings = await this.client.database.getDocument('guild', guild);
    if (!settings) return;

    i18n.setLocale(settings.misc.locale);
    const time = Date.now();

    const msg = [i18n.__(`moderation.log.${action}`, {
      caseID: (settings.moderation.cases.length + 1),
      author: this.client.users.get(author).tag,
      target: this.client.channels.has(target) ? `<#${target}>` : (await this.client.fetchUser(target).then(u => u.tag)),
      targetID: target,
      time: mtz(time).tz(settings.misc.timezone).format(settings.misc.timeFormat),
      extra,
    }), i18n.__('moderation.log.reason', { reason })];

    const textChannel = this.client.channels.get(settings.moderation.channel);
    if (!textChannel) return;

    const sentMessage = await textChannel.send(msg.join('\n'));
    const message = {
      channel: textChannel.id,
      message: sentMessage.id,
    };

    const moderationCase = {
      action,
      author,
      target,
      reason,
      message,
      time,
      extra,
    };

    settings.moderation.cases.push(moderationCase);
    await this.client.database.insertDocument('guild', settings, { conflict: 'update' });

    return moderationCase;
  }

  /**
   * Can the author interact with the target ?
   * @param {*} author GuildMember object of author
   * @param {*} target GuildMember object of target
   * @param {*} bot GuildMember object of bot
   * @returns {Boolean}
   */
  canInteract(author, target, bot) {
    if (target.highestRole.comparePositionTo(bot.highestRole) >= 0) return false;
    else if (author.highestRole.comparePositionTo(target.highestRole) <= 0) return false;
    return true;
  }
}

module.exports = ModHelper;
