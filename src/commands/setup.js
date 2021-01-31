/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import Discord from "discord.js"
import {serverColl, serverList} from "../index"
import {findChannel, returnBoard} from "../functions"

export default {
  name: "setup",
  description: "A setup wizard to help set things up",
  args: 0,
  usage: "",
  guildOnly: true,
  cooldown: 0,
  aliases: [],
  async execute (message, args){
    if (!message.member.hasPermission("MANAGE_GUILD")) {
      return message.channel.send("You need the manage server permission to setup!")
    }

    let server = await serverColl.findOne({_id: message.guild.id}),
      reply,
      timedout,
      filter

    if (!server) {
      serverColl.insertOne({
        _id: message.guild.id,
        prefix: "s.",
        channel: null,
        statboards: [],
        messages: [],
        cooldown: 5,
      })
        
      serverList.updateOne({_id: "0"}, {$push: {servers: message.guild.id}})

      reply = new Discord.MessageEmbed()
        .setTitle("Database")
        .setDescription("Since your server wasn't already, I've added your server to my database.")

      message.channel.send(reply)

      server = await serverColl.findOne({_id: message.guild.id})
    }
    
    filter = response => {
      return response.author === message.author
    }

    reply = new Discord.MessageEmbed()
      .setTitle("Prefix")
      .setDescription(`Your current server prefix is \`${server.prefix}\`. What would you like to change it to?`)
    await message.channel.send(reply)
      .then(async () => {
        await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]})
          .then(newPrefix => {
            serverColl.updateOne(
              {_id: message.guild.id},
              {$set: {prefix: newPrefix.first().content}}
            )
          })
          .catch(() => {
            timedout = true
            return message.channel.send("Menu timed out, please use the command again!")
          })
      })
    if (timedout) {return}

    filter = response => {
      return response.author === message.author && parseInt(response.content, 10) >= 5
    }

    reply = new Discord.MessageEmbed()
      .setTitle("Cooldown")
      .setDescription(`The server cooldown determines how many iterations happen before your statboards get updated. An iteration takes at least one second. Minimum value is 5, current value is \`${server.cooldown}\``)
    await message.channel.send(reply)
      .then(async () => {
        await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]})
          .then(newCooldown => {
            serverColl.updateOne(
              {_id: message.guild.id},
              {$set: {cooldown: parseInt(newCooldown.first().content, 10)}}
            )
          })
          .catch(() => {
            timedout = true
            return message.channel.send("Menu timed out, please use the command again!")
          })
      })
    if (timedout) {return}

    filter = response => {
      return response.author === message.author && findChannel(response.content, message.guild.id)
    }

    reply = new Discord.MessageEmbed()
      .setTitle("Channel")
      .setDescription(`This determines which channel the bot uses to display stats. Current channel is ${server.channel ? `<#${server.channel}>` : "not set"}. Send the ID, name, or mention it.`)
    await message.channel.send(reply)
      .then(async () => {
        await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]})
          .then(newChannel => {
            serverColl.updateOne(
              {_id: message.guild.id},
              {$set: {channel: findChannel(newChannel.first().content, message.guild.id).id}
            })
          })
          .catch(error => {
            timedout = true
            return message.channel.send("Menu timed out, please use the command again!")
          })
      })
    if (timedout) {return}

    filter = response => {
      return response.author === message.author && response.content.split(" ").filter(board =>
        ["0", "1", "2", "3", "90"].includes(board)
      ).length
    }

    reply = new Discord.MessageEmbed()
      .setTitle("Boards")
      .setDescription(`This changes what statistics are shown in your channel. They are listed below. Please type the numbers, seperated by spaces.`)
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
      )

    await message.channel.send(reply)
      .then(async () => {
        await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]})
          .then(async input => {
            let messages = [],
              boards = input.first().content.split(" ")
                .filter(board =>
                  ["0", "1", "2", "3", "90"].includes(board)
                )

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
                await message.guild.channels.cache.get(server.channel).send(await returnBoard("general", message.guild.id))
                  .then((sentMsg) => messages.push(sentMsg.id))

                break

              case "1":
                await message.guild.channels.cache.get(server.channel).send(await returnBoard("presences", message.guild.id))
                  .then((sentMsg) => messages.push(sentMsg.id))

                break

              case "2":
                await message.guild.channels.cache.get(server.channel).send(await returnBoard("bots", message.guild.id))
                  .then((sentMsg) => messages.push(sentMsg.id))

                break

              case "3":
                await message.guild.channels.cache.get(server.channel).send(await returnBoard("bot", message.guild.id))
                  .then((sentMsg) => messages.push(sentMsg.id))

                break

              case "90":
                await message.guild.channels.cache.get(server.channel).send(await returnBoard("gMembers", message.guild.id))
                  .then((sentMsg) => messages.push(sentMsg.id))

                break
      
              default:
              }
            }

            serverColl.updateOne({_id: message.guild.id}, {$set: {messages: messages,
              statboards: boards.map((board) => Number(board))}})

            
          })
          .catch(() => {
            timedout = true
            return message.channel.send("Menu timed out, please use the command again!")
          })
      })
    if (timedout) {return}

    reply = new Discord.MessageEmbed()
      .setTitle("Success!")
      .setDescription("Your sever has been set up!")
    message.channel.send(reply)
  }
}
