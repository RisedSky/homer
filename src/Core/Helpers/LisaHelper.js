const Helper = require('./Helper');

/**
 * Represents a Lisa helper.
 * @extends {Helper}
 */
class LisaHelper extends Helper {
  /**
   * Process a string (usually a tag).
   * @param {String} string String to process
   * @param {*} context Context of the process
   * @param {Number} contextType Type of the context (0: Tag - 1: Welcome/Leave)
   * @returns {Promise<String>} Proceeded string
   */
  async process(string, context, contextType) {
    const newString = await this.replaceStatic(string, context, contextType);

    return (await this.replaceDynamic(newString, context, contextType));
  }

  /**
   * Replaces static content.
   * @param {String} string String to process
   * @param {*} context Context of the process
   * @param {Number} contextType Type of the context (0: Tag - 1: Welcome/Leave)
   * @returns {Promise<String>} Proceeded string
   */
  async replaceStatic(string, context, contextType) {
    const settings = contextType === 0 ? context.ctx.settings.data : await this.client.database.getDocument('guild', context.guild.id);
    let newString = string;

    if (contextType === 0) {
      newString = newString
        .replace(/{atuser}/g, context.ctx.author.toString())
        .replace(/{user}/g, context.ctx.author.username)
        .replace(/{userid}/g, context.ctx.author.id)
        .replace(/{nick}/g, context.ctx.member.nickname || context.ctx.author.username)
        .replace(/{discrim}/g, context.ctx.author.discriminator)
        .replace(/{server}/g, context.ctx.guild.name)
        .replace(/{serverid}/g, context.ctx.guild.id)
        .replace(/{servercount}/g, context.ctx.guild.memberCount)
        .replace(/{channel}/g, context.ctx.channel.name)
        .replace(/{channelid}/g, context.ctx.channel.id)
        .replace(/{args}/g, context.args.join(' '))
        .replace(/{argslen}/g, context.args.length);
    } else if (contextType === 1) {
      newString = newString
        .replace(/{atuser}/g, context.user.toString())
        .replace(/{user}/g, context.user.username)
        .replace(/{userid}/g, context.user.id)
        .replace(/{nick}/g, context.nickname || context.user.username)
        .replace(/{discrim}/g, context.user.discriminator)
        .replace(/{server}/g, context.guild.name)
        .replace(/{serverid}/g, context.guild.id)
        .replace(/{servercount}/g, context.guild.memberCount);
    }

    return newString
      .replace(/{locale}/g, settings.misc.locale)
      .replace(/{timezone}/g, settings.misc.timezone)
      .replace(/{timeFormat}/g, settings.misc.timeFormat)
      .replace(/{dateFormat}/g, settings.misc.dateFormat);
  }

  /**
   * Replaces dynamic content.
   * @param {String} string String to process
   * @param {*} context Context of the process
   * @param {Number} contextType Type of the context (0: Tag - 1: Welcome/Leave)
   * @returns {Promise<String>} Proceeded string
   */
  async replaceDynamic(string, context, contextType) {
    const foundFunctions = string.match(this.client.constants.functionPattern);
    if (!foundFunctions) return string;
    const settings = contextType === 0 ? context.ctx.settings.data : await this.client.database.getDocument('guild', context.guild.id);
    
    const pattern = this.client.constants.functionPattern;
    let newString = string;

    foundFunctions.forEach((fn) => {
      const parsedInput = pattern.exec(fn);
      if (!parsedInput || !parsedInput[1] || !parsedInput[2]) return;

      try {
        const customFunction = new (require(`../../Production/Tags/${parsedInput[1]}`))(this.client, context, contextType);
        if (!customFunction) return;

        const result = customFunction.run(parsedInput[2].split('|'), context, contextType, settings);
        newString = newString.replace(fn, result);
        pattern.lastIndex = 0;
      } catch (e) {
        newString = newString.replace(fn, e);
        pattern.lastIndex = 0;
      }
    });

    return newString;
  }
}

module.exports = LisaHelper;
