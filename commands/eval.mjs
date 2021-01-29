/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

export default {
  name: "evaluate",
  description: "For the dev only",
  args: 1,
  usage: "<code>",
  guildOnly: false,
  cooldown: 0,
  aliases: ["eval", "e"],
  execute (message, args) {
    if (message.author.id !== "690575294674894879") {
      return message.channel.send("I don't think so") 
    }

    const reply = eval(args.join())

    return message.channel.send(`\`${reply}\``)
  },
}
