const Command = require('../../../Core/Structures/Command');
const DataProfile = require('../../../Core/Structures/Data/DataProfile');
const durationParser = require('parse-duration');
const mtz = require('moment-timezone');

class Remind extends Command {
  constructor(client) {
    super(client, {
      name: 'remind',
      aliases: ['reminder', 'remindme'],
      category: 'misc',
    });
  }

  async run(ctx) {
    const profile = new DataProfile(this.client, ctx.author.id);
    await profile.getData();

    if (ctx.args[0] === 'list') {
      if (profile.data.reminds.length === 0) return ctx.channel.send(ctx.__('remind.error.noRemind', {
        errorIcon: this.client.constants.statusEmotes.error,
      }));

      const reminds = profile.data.reminds.map(remind => ctx.__('remind.list.remind', {
        content: remind.content,
        set: mtz(remind.set).locale(ctx.settings.data.misc.locale).fromNow(),
        expires: mtz().locale(ctx.settings.data.misc.locale).to(remind.end),
        index: remind.index,
      })).join('\n');

      ctx.channel.send(ctx.__('remind.list', {
        reminds,
      }));
    } else if (ctx.args[0] === 'remove') {
      if (profile.data.reminds.length === 0) return ctx.channel.send(ctx.__('remind.error.noRemind', {
        errorIcon: this.client.constants.statusEmotes.error,
      }));

      if (ctx.args[1]) {
        const remind = profile.data.reminds.find(r => r.index === parseInt(ctx.args[1]));
        if (!remind) return ctx.channel.send(ctx.__('remind.error.noRemindFound', {
          errorIcon: this.client.constants.statusEmotes.error,
          index: ctx.args[1],
        }));

        profile.data.reminds.splice(profile.data.reminds.indexOf(remind), 1);
        await profile.saveData();

        ctx.channel.send(ctx.__('remind.removed', {
          successIcon: this.client.constants.statusEmotes.success,
          remind: remind.index,
        }));
      }
    } else {
      let duration = 0;
      let content = null;
      let durationFinished = false;
      for (let i = 0; i < ctx.args.length; i += 1) {
        const argument = ctx.args[i];
        if (!durationFinished) {
          const parsedDuration = durationParser(argument);
          if (parsedDuration !== 0) duration += parsedDuration;
          else durationFinished = true;
        }

        if (durationFinished) {
          if (duration === 0) return ctx.channel.send(ctx.__('remind.error.invalidParameters', {
            errorIcon: this.client.constants.statusEmotes.error,
          }));

          typeof content === 'string' ? content += ` ${argument}` : content = argument;
        }
      }

      if (!content || content.length > 256) return ctx.channel.send(ctx.__('remind.error.invalidParameters', {
        errorIcon: this.client.constants.statusEmotes.error,
      }));

      if (duration > 2147483647) return ctx.channel.send(ctx.__('remind.error.invalidDuration', {
        errorIcon: this.client.constants.statusEmotes.error,
      }));

      const end = profile.data.reminds
        .sort((a, b) => a.index - b.index)[profile.data.reminds.length - 1];
      const remind = {
        index: end ? (end.index + 1) : 1,
        content,
        guild: ctx.guild.id,
        channel: ctx.channel.id,
        expires: duration,
        end: (Date.now() + duration),
        set: Date.now(),
      };

      profile.data.reminds.push(remind);
      await profile.saveData();

      setTimeout(
        this.client.stuffHandler.handleRemind,
        remind.expires,
        this.client,
        ctx.author.id,
        remind.index,
      );

      ctx.channel.send(ctx.__('remind.set', {
        successIcon: this.client.constants.statusEmotes.success,
        index: remind.index,
        set: mtz().locale(ctx.settings.data.misc.locale).to(remind.end),
      }));
    }
  }

  /**
   * Capitalize the first letter of a string and returns it.
   * @param {String} text String to process
   * @returns {String}
   */
  capitalizeFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

module.exports = Remind;
