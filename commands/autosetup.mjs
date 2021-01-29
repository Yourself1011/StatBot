/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import {serverColl, serverList} from "../index.mjs"
import {returnBoard} from "../functions.mjs" 

export default {
  name: "autosetup",
  description: "Quickly and automatically set up your server with default settings",
  args: 0,
  usage: "",
  guildOnly: true,
  cooldown: 30,
  aliases: [],
  async execute (message) {
    if (!message.guild.me.hasPermission(["MANAGE_CHANNELS", "VIEW_CHANNEL", "SEND_MESSAGES", "BAN_MEMBERS", "USE_EXTERNAL_EMOJIS"])) {
      return message.channel.send("I am missing some permissions! Please make sure I can `Manage channels`, `View channels`, `Send messages`, `Ban members` (to access the ban list), `Use external emojis`")
    }

    if (!message.member.hasPermission("MANAGE_GUILD")) {
      message.channel.send("You need the manage server permission to change settings!")
    }

    const added = await serverColl.findOne({_id: message.guild.id})

    if (!added) {
      message.guild.channels.create("Statistics-📊", "text").then(async (channel) => {
        channel.send(await returnBoard("general", message.guild.id)).then((message) => {
          serverColl.insertOne({
              _id: message.guild.id,
              prefix: "s.",
              channel: channel.id,
              statboards: [0],
              messages: [message.id],
              cooldown: 5,
            })
            
          serverList.updateOne({_id: "0"}, {$push: {servers: message.guild.id}})
        })
      })
    } else {

      message.guild.channels.create("Statistics-📊", "text").then(async (channel) => {
        channel.send(await returnBoard("general", message.guild.id)).then((message) => {
          serverColl.updateOne({_id: message.guild.id},
            {$set: {
              _id: message.guild.id,
              prefix: "s.",
              channel: channel.id,
              statboards: [0],
              messages: [message.id],
              cooldown: 5,
            }})
        })
      })
    }
    message.react("✅")
  },
}
