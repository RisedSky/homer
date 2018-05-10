const Command = require('../../../Core/Structures/Command');
const DataTag = require('../../../Core/Structures/Data/DataTag');
const moment = require('moment-timezone');
const { Util } = require('discord.js');

class Tag extends Command {
  constructor(client) {
    super(client, {
      name: 'tag',
      aliases: ['t'],
      category: 'misc',
    });
  }

  async run(ctx) {
    if (ctx.args[0] === 'create') {
      this.subCreate(ctx);
    } else if (ctx.args[0] === 'edit') {
      this.subEdit(ctx);
    } else if (ctx.args[0] === 'delete') {
      this.subDelete(ctx);
    } else if (ctx.args[0] === 'owner') {
      this.subOwner(ctx);
    } else if (ctx.args[0] === 'raw') {
      this.subRaw(ctx);
    } else if (ctx.args[0] === 'search') {
      this.subSearch(ctx);
    } else if (ctx.args[0] === 'random') {
      this.subRandom(ctx);
    } else if (ctx.args[0] === 'list') {
      this.subList(ctx);
    } else {
      const tagName = ctx.args[0];
      const args = ctx.args.slice(1);

      if (!tagName) return ctx.channel.send(ctx.__('tag.common.noTag', {
        errorIcon: this.client.constants.statusEmotes.error,
      }));

      const tag = new DataTag(this.client, tagName);
      await tag.getData();

      if (!tag.data.content) return ctx.channel.send(ctx.__('tag.common.doesNotExist', {
        errorIcon: this.client.constants.statusEmotes.error,
        tag: tagName,
      }));

      tag.incrementUses();
      const proceeded = await this.client.lisa.process(tag.data.content, { ctx, tag, args }, 0);

      ctx.channel.send(proceeded);
    }
  }

  async subCreate(ctx) {
    const tagName = ctx.args[1];
    const tagContent = ctx.args.slice(2).join(' ');

    if (!tagName || !tagContent) return ctx.channel.send(ctx.__('tag.common.invalidParameters', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    if (['create', 'edit', 'delete', 'owner', 'search', 'list', 'random', 'row'].some(a => a === tagName)) return ctx.channel.send(ctx.__('tag.create.reservedName', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    if (tagContent.length > 1024) return ctx.channel.send(ctx.__('tag.common.contentTooLong', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tag = new DataTag(this.client, tagName);
    await tag.getData();

    if (tag.data.content) return ctx.channel.send(ctx.__('tag.create.alreadyExists', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    tag.data.author = ctx.author.id;
    tag.data.content = tagContent;

    await tag.saveData();
    ctx.channel.send(ctx.__('tag.create.created', {
      successIcon: this.client.constants.statusEmotes.success,
      tag: tagName,
    }));

    this.tagLog(`**${Util.escapeMarkdown(ctx.author.tag)}** (ID:${ctx.author.id}) created the tag \`${Util.escapeMarkdown(tagName)}\` on **${Util.escapeMarkdown(ctx.guild.name)}**`);
  }

  async subEdit(ctx) {
    const tagName = ctx.args[1];
    const tagContent = ctx.args.slice(2).join(' ');

    if (!tagName || !tagContent) return ctx.channel.send(ctx.__('tag.common.invalidParameters', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    if (tagContent.length > 1024) return ctx.channel.send(ctx.__('tag.common.contentTooLong', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tag = new DataTag(this.client, tagName);
    await tag.getData();

    if (!tag.data.content) return ctx.channel.send(ctx.__('tag.common.doesNotExist', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    if (tag.data.author !== ctx.author.id) return ctx.channel.send(ctx.__('tag.common.notOwner', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    tag.data.content = tagContent;
    tag.data.edit = Date.now();

    await tag.saveData();
    ctx.channel.send(ctx.__('tag.edit.edited', {
      successIcon: this.client.constants.statusEmotes.success,
      tag: tagName,
    }));

    this.tagLog(`**${Util.escapeMarkdown(ctx.author.tag)}** (ID:${ctx.author.id}) edited the tag \`${Util.escapeMarkdown(tagName)}\` on **${Util.escapeMarkdown(ctx.guild.name)}**`);
  }

  async subDelete(ctx) {
    const tagName = ctx.args[1];

    if (!tagName) return ctx.channel.send(ctx.__('tag.common.noTag', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tag = new DataTag(this.client, tagName);
    await tag.getData();

    if (!tag.data.content) return ctx.channel.send(ctx.__('tag.common.doesNotExist', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    if (tag.data.author !== ctx.author.id) return ctx.channel.send(ctx.__('tag.common.notOwner', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    await this.client.database.deleteDocument('tag', tagName);
    ctx.channel.send(ctx.__('tag.delete.deleted', {
      successIcon: this.client.constants.statusEmotes.success,
      tag: tagName,
    }));

    this.tagLog(`**${Util.escapeMarkdown(ctx.author.tag)}** (ID:${ctx.author.id}) deleted the tag \`${Util.escapeMarkdown(tagName)}\` on **${Util.escapeMarkdown(ctx.guild.name)}**`);
  }

  async subOwner(ctx) {
    const tagName = ctx.args[1];

    if (!tagName) return ctx.channel.send(ctx.__('tag.common.noTag', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tag = new DataTag(this.client, tagName);
    await tag.getData();

    if (!tag.data.content) return ctx.channel.send(ctx.__('tag.common.doesNotExist', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    const owner = await this.client.fetchUser(tag.data.author)
      .then(user => ({ id: user.id, tag: user.tag }));

    ctx.channel.send(ctx.__('tag.owner.ownerIs', {
      tag: tagName,
      owner,
    }));
  }

  async subRaw(ctx) {
    const tagName = ctx.args[1];

    if (!tagName) return ctx.channel.send(ctx.__('tag.common.noTag', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tag = new DataTag(this.client, tagName);
    await tag.getData();

    if (!tag.data.content) return ctx.channel.send(ctx.__('tag.common.doesNotExist', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: tagName,
    }));

    ctx.channel.send(ctx.__('tag.raw.rawTag', {
      tag: tagName,
      rawTag: Util.escapeMarkdown(tag.data.content, true),
    }));
  }

  async subSearch(ctx) {
    const tagName = ctx.args[1];

    if (!tagName) return ctx.channel.send(ctx.__('tag.common.noTag', {
      errorIcon: this.client.constants.statusEmotes.error,
    }));

    const tags = await this.client.database.getDocuments('tag');
    const found = tags.filter(t => t.id.toLowerCase().includes(tagName.toLowerCase()));

    if (found.length === 0) return ctx.channel.send(ctx.__('tag.search.nothingFound', {
      errorIcon: this.client.constants.statusEmotes.error,
      query: tagName,
    }));

    ctx.channel.send(ctx.__('tag.search.found', {
      query: tagName,
      list: found.map(t => `\`${t.id}\``).join(', '),
    }));
  }

  async subRandom(ctx) {
    const random = await this.client.database.getDocuments('tag').then(tags => tags[Math.floor(Math.random() * tags.length)]);

    const tag = new DataTag(this.client, random.id);
    await tag.getData();

    const args = ctx.args.slice(1);
    tag.incrementUses();
    const proceeded = await this.client.lisa.process(tag.data.content, { ctx, tag, args }, 0);

    ctx.channel.send(proceeded);
  }

  async subList(ctx) {
    await ctx.guild.fetchMembers();

    let { member } = ctx;
    const search = ctx.args.slice(1).join(' ');
    if (ctx.mentions.members.size > 0) member = ctx.mentions.members.first();
    else if (search) {
      const members = this.client.finder.findMembers(search, ctx.guild.id);
      if (members.size === 0) return ctx.channel.send(ctx.__('finder.members.noResult', { errorIcon: this.client.constants.statusEmotes.error, search }));
      else if (members.size > 1) return ctx.channel.send(this.client.finder.formatMembers(
        members,
        ctx.settings.data.misc.locale,
      ));
      member = members.first();
    }

    const mappedTags = await this.client.database.getDocuments('tag').then(tags => tags
      .filter(t => t.author === member.id)
      .map(t => `\`${t.id}\``));

    if (mappedTags.length === 0) return ctx.channel.send(ctx.__('tag.list.noTags', {
      errorIcon: this.client.constants.statusEmotes.error,
      tag: member.user.tag,
    }));

    ctx.channel.send(ctx.__('tag.list', {
      tag: member.user.tag,
      list: mappedTags.join(', '),
    }));
  }

  /**
   * Sends a log in the tag-log channel.
   * @param {String} message Message to send
   */
  async tagLog(message) {
    const channel = this.client.channels.get(this.client.config.logChannels.tag);
    if (!channel) return;

    const formattedTime = moment().format('HH:mm:ss');
    channel.send(`\`[${formattedTime}]\` 🏷 ${message}`);
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

module.exports = Tag;
