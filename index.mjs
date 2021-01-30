/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import {returnBoard} from "./functions.mjs"

import loop from "./loop.mjs"

import Discord from "discord.js"
import mongoDb from "mongodb"
import fs from "fs"

const {MongoClient: Mongo} = mongoDb 

export const client = new Discord.Client()
const token = process.env.BETATOKEN,
  cooldowns = new Discord.Collection()

client.commands = new Discord.Collection()

const mongoUri = process.env.MONGOURI,
  mongoClient = new Mongo(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
let serverColl,
  serverList

export const connection = new Promise((resolve, reject) => {
  mongoClient.connect((err) => {
    if (err) {
      return reject(err)
    }

    console.log("Mongo connected")
    serverColl = mongoClient.db("betaServers").collection("Servers")
    serverList = mongoClient.db("betaServers").collection("ServerList")

    return resolve()
  })

})

export {
  serverColl,
  serverList,
}

client.once("ready", () => {
  loop()
  console.log("Discord client ready")
})

client.login(token)

const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".mjs")),
  commands = []

for (const file of commandFiles) {
  commands.push(import(`./commands/${file}`))
}

Promise.all(commands).then((vals) => {
  for (const command of vals) {
    client.commands.set(command.default.name, command.default)
  }
})

client.on("message", async (message) => {
  let prefix = "s.",
    serverInfo

  if (message.channel.type !== "dm") {
    serverInfo = await serverColl.findOne({_id: message.guild.id})

    prefix = serverInfo ? serverInfo.prefix : "s."
  }

  if (message.content === "<@764276231805075456>" || message.content === "<@!764276231805075456>") {
    return message.channel.send(`My prefix is \`${prefix}\``) 
  }

  if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot) {
    return
  }

  const args = message.content.slice(prefix.length).trim()
      .split(/ +/u),
    commandName = args.shift().toLowerCase(),

    command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName),
    )

  if (!command) {
    return
  }

  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply("I can't execute that command inside DMs!")
  }

  if (command.args && args.length < command.args) {
    let reply = `You didn't provide enough arguments, <@${message.author.id}>!`

    if (command.usage) {
      reply += `\nThe correct usage is \`${prefix}${commandName} ${command.usage}\``
    }
    
    return message.channel.send(reply)
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection())
  }

  const now = Date.now(),
    timestamps = cooldowns.get(command.name),
    cooldownAmount = (command.cooldown || 0) * 1000

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000,

        reply = new Discord.MessageEmbed()
          .setTitle("Chill")
          .setDescription(`Ya gotta wait ${timeLeft.toFixed(1)} more seconds.`)
          .setColor("#FF0000")

      return message.channel.send(reply)
    }
  }

  command.execute(message, args, serverInfo)
    .catch((error) => {
      console.error(error)
      message.reply(`I pooped. Send this to the devs: \n\`\`\`\n${error}\n\`\`\``)
    })
})

client.on("guildCreate", (guild) => {
  if (guild.me.permissions.serialize().MANAGE_CHANNELS) {
    guild.channels.create("Statistics-📊", "text").then(async (channel) => {
      channel.send(await returnBoard("general", guild.id)).then((message) => {
        serverColl.insertOne({
          _id: guild.id,
          prefix: "s.",
          channel: channel.id,
          statboards: [0],
          messages: [message.id],
          cooldown: 5,
        })
      })
    })
  } else {
    serverColl.insertOne({
      _id: guild.id,
      prefix: "s.",
      channel: null,
      statboards: [],
      messages: [],
      cooldown: 5,
    })
  }
  serverList.updateOne({_id: "0"}, {$push: {servers: guild.id}})

})

client.on("guildDelete", (guild) => {
  serverColl.removeOne({_id: guild.id})
  serverList.updateOne({_id: "0"}, {$pull: {servers: guild.id}})
})

console.log(`Statbot
Copyright 2020-2021 Daniel Zhang
BSD-3-Clause License`)
