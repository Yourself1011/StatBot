/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */
import Discord from "discord.js"
import {serverColl} from "../index"
import {findChannel, returnBoard} from "../functions"

export default {
  name: "settings",
  description: "Change the settings of your server",
  args: 0,
  usage: "[setting]",
  guildOnly: true,
  cooldown: 15,
  aliases: ["set"],
  async execute (message, args) {
    if (!args.length) {
      const reply = new Discord.MessageEmbed()
        .setTitle("Settings")
        .setDescription("`cooldown`, `channel`, `boards`, `prefix`")

      message.channel.send(reply)
    } else if (!message.member.hasPermission("MANAGE_GUILD")) {
      message.channel.send("You need the manage server permission to change settings!")
    } else {

      const mongoGuild = await serverColl.findOne({_id: message.guild.id}),


        messages = []

      switch (args[0]) {
      case "cooldown":

        if (args.length < 2) {
          const reply = new Discord.MessageEmbed()
            .setTitle("Cooldown")
            .setDescription("Sets the interval that your server's statboards are updated. Intervals take 1 second minimum.")

            
          return message.channel.send(reply)
        }

        if (args[1] < 5) {
          return message.channel.send("The cooldown must be higher than 5.")
        }
        serverColl
        .updateOne(
          {_id: message.guild.id}, 
          {$set: {cooldown: parseInt(args[1], 10)}
        })

        message.channel.send(`Success! Your server's cooldown is now \`${args[1]}\``)
        break

      case "prefix":
        if (args.length < 2) {
          const reply = new Discord.MessageEmbed()
            .setTitle("Prefix")
            .setDescription("Changes what a message needs at the beginning in order for the bot to respond")

            
          return message.channel.send(reply)
        }

        serverColl.updateOne({_id: message.guild.id}, {$set: {prefix: args[1]}})
        message.channel.send(`Success! Your server's prefix is now \`${args[1]}\``)
        break

      case "channel":
        if (args.length < 2) {
          const reply = new Discord.MessageEmbed()
            .setTitle("Channel")
            .setDescription("Changes the channel where stats are displayed.")
            
          return message.channel.send(reply)
        }

        const channel = findChannel(args[1], message.guild.id)

        if (!channel) {
          return message.channel.send("Either that channel doesn't exist, or I couldn't find it. Please use the channel's exact name, id, or mention the channel.")
        }

        const perms = message
          .guild
          .me
          .permissionsIn(
            message
            .guild
            .channels
            .cache
            .get(channel.id)
            )
          .serialize()

        if (!(perms.VIEW_CHANNEL
          && perms.SEND_MESSAGES 
          && perms.EMBED_LINKS 
          && perms.MANAGE_MESSAGES)) {
          return message.channel.send("I am missing some permissions. Please make sure I can do the following in that channel: `View channel`, `Send messages`, `Embed links`, `Manage messages`")
        }
        

        for (const statboard of mongoGuild.statboards) {
          switch (statboard) {
          case 0:
            await channel.send(await returnBoard("general", message.guild.id)).then((sentMsg) => messages.push(sentMsg.id))

            break

          case 1:
            await channel.send(await returnBoard("presences", message.guild.id)).then((sentMsg) => messages.push(sentMsg.id))

            break

          case 2:
            await channel.send(await returnBoard("bots", message.guild.id)).then((sentMsg) => messages.push(sentMsg.id))

            break
          case 3:
            await channel.send(await returnBoard("bot", message.guild.id)).then((sentMsg) => messages.push(sentMsg.id))

            break
  
          case 90:
            await channel.send(await returnBoard("gMembers", message.guild.id)).then((sentMsg) => messages.push(sentMsg.id))

            break

          default:
          }
        }

        serverColl.updateOne({_id: message.guild.id}, {$set: {messages,
          channel: channel.id}})

        message.channel.send(`Success! <#${channel.id}> is now your new statistics channel!`)

        break

      case "boards":
        if (args.length < 2) {
          return message.channel.send(new Discord.MessageEmbed()
            .setTitle("Boards")
            .setDescription("Use the board numbers and customize which stat boards are in your server! Here are the available stat boards:")
            .addFields(
              {name: "`0`: General",
                value: "The default stat board. Gives info on server members, channels, emojis and roles"},
              {name: "`1`: Presences",
                value: "Gives info on people playing things, watching things, etc."},
              {name: "`2`: Bots",
                value: "Gives the statuses of the bots in your server"},
              {name: "`3`: Bot",
                value: "Gives info on me"},
              {name: "`90`: Members graph",
                value: "A graph of member growth in the past 7 days"},
            ),
          )
        }


        const boards = args.filter((arg) => ["0", "1", "2", "3", "90"].includes(arg),
        )
          
        if (!boards.length) {
          return message.channel.send("You didn't provide any valid boards!")
        }

        if (boards.length > 4) {
          return message.channel.send("You've chosen too many boards! The maximum is 4.")
        }

        for (const msgs of mongoGuild.messages) {
          const place = mongoGuild.messages.indexOf(msgs)

          message
            .guild
            .channels
            .cache
            .get(mongoGuild.channel)
            .messages
            .fetch(mongoGuild.messages[place])
            .then((msg) => {
              msg.delete()
            })
        }

        serverColl.updateOne({_id: message.guild.id}, {$unset: {members: ""}})

        if (boards.includes("90")) {
          serverColl
            .updateOne(
              {_id: message.guild.id}, 
              {$set: 
                {members: [message.guild.members.cache.size]}
              }
            )
        }
          
        for (const statboard of boards) {
          switch (statboard) {
          case "0":
            await message.guild.channels.cache.get(mongoGuild.channel).send(await returnBoard("general", message.guild.id))
              .then((sentMsg) => messages.push(sentMsg.id))

            break

          case "1":
            await message.guild.channels.cache.get(mongoGuild.channel).send(await returnBoard("presences", message.guild.id))
              .then((sentMsg) => messages.push(sentMsg.id))

            break

          case "2":
            await message.guild.channels.cache.get(mongoGuild.channel).send(await returnBoard("bots", message.guild.id))
              .then((sentMsg) => messages.push(sentMsg.id))

            break

          case "3":
            await message.guild.channels.cache.get(mongoGuild.channel).send(await returnBoard("bot", message.guild.id))
              .then((sentMsg) => messages.push(sentMsg.id))

            break

          case "90":
            await message.guild.channels.cache.get(mongoGuild.channel).send(await returnBoard("gMembers", message.guild.id))
              .then((sentMsg) => messages.push(sentMsg.id))

            break
  
          default:
          }
        }

        serverColl.updateOne({_id: message.guild.id}, {$set: {messages: messages,
          statboards: boards.map((board) => Number(board))}})

        message.channel.send("Success! I have updated your stat boards")

        break
          
      default:
        message.channel.send("That's not a valid setting!")
      }
    }
  },
}
