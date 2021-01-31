/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import Discord from "discord.js"

export default {
  name: "help",
  description: "Shows the commands",
  args: 0,
  usage: "[command | 'here']",
  guildOnly: false,
  cooldown: 5,
  aliases: ["commands", "cmds"],
  execute (message, args, serverInfo) {
    if (serverInfo) {
      var {prefix} = serverInfo
    } else {
      var prefix = "s."
    }
    const {commands} = message.client

    if (!args.length || args[0] === "here") {
      const commandList = `\`${commands.map((command) => command.name).join("`, `")}\``,
        reply = new Discord.MessageEmbed()
          .setTitle("My commands")
          .setDescription(commandList)
          .setFooter(`You can use ${prefix}help [command] to get more info on a certain command.`)

      if (!args.length) {
        return message.author.send(reply)
          .then(() => {
            if (message.channel.type === "dm") {
              return
            }
            message.reply("I've sent you a DM with all my commands!")
          })
          .catch((error) => {
            console.error(`Could not send help DM to ${message.author.tag}.\n`, error)
            message.reply("it seems like I can't DM you! Do you have DMs disabled?")
          })
      } 
            
      return message.channel.send(reply)
    
    }

    const name = args[0].toLowerCase(),
      command = commands.get(name) || commands.find((c) => c.aliases && c.aliases.includes(name))

    if (!command) {
      return message.channel.send("That's not a command!")
    }

    let reply = new Discord.MessageEmbed()
      .setTitle(command.name)
      .setDescription(command.description)
      .addFields(
        {name: "Aliases",
          value: command.aliases.join(", ")},
        {name: "Usage",
          value: `${prefix}${command.name} ${command.usage}`},
      )
      .setFooter(`Cooldown: ${command.cooldown}` || 0)

    message.channel.send(reply)
  },
}
