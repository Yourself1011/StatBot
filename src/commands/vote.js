/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */
import Discord from "discord.js"

export default {
  name: "vote",
  description: "Gives the links to vote for the bot.",
  args: 0,
  usage: "",
  guildOnly: false,
  cooldown: 5,
  aliases: [],
  async execute (message, args){
    return Discord.MessageEmbed()
    .setTitle("Vote for the bot!")
    .setDescription(`
    [discordbotlist.com](https://discordbotlist.com/bots/statbot/upvote)
    `)
  }
}