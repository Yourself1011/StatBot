/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import {client, serverColl} from "./index"
import Discord from "discord.js"
import imageCharts from "image-charts"

export function findChannel (input, guildId) {
  let channel = false

  if (
    input.startsWith("<#") && 
    input.endsWith(">") && 
    client.guilds.cache
      .get(guildId)
      .channels
      .cache
      .find((chan) => chan.id === input.slice(2, -1))
  ) {

    channel = client.guilds.cache.get(guildId)
      .channels.cache
      .find((chan) => chan.id === input.slice(2, -1))

  } else if (
    client.guilds.cache
      .get(guildId)
      .channels
      .cache
      .find((chan) => chan.id === input)
  ) {

    channel = client.guilds.cache
      .get(guildId)
      .channels
      .cache
      .find((chan) => chan.id === input)

  } else if (
    client
      .guilds
      .cache
      .get(guildId)
      .channels
      .cache
      .find((chan) => chan.name.includes(input))
  ) {
    channel = client.guilds.cache
      .get(guildId)
      .channels.cache
      .find((chan) => chan.name.includes(input))
  }
  
  return channel
}

export function findRole (input, guildId) {
  let role = false

  if (
    input.startsWith("<@&") && 
    input.endsWith(">") && 
    client.guilds.cache
      .get(guildId)
      .roles
      .cache
      .find((role) => role.id === input.slice(3, -1))
  ) {

    role = client.guilds.cache.get(guildId)
      .roles.cache
      .find((role) => role.id === input.slice(3, -1))

  } else if (
    client.guilds.cache
      .get(guildId)
      .roles
      .cache
      .find((role) => role.id === input)
  ) {

    role = client.guilds.cache
      .get(guildId)
      .roles
      .cache
      .find((role) => role.id === input)

  } else if (
    client
      .guilds
      .cache
      .get(guildId)
      .roles
      .cache
      .find((role) => role.name.toLowerCase().includes(input.toLowerCase()))
  ) {
    role = client.guilds.cache
      .get(guildId)
      .roles.cache
      .find((role) => role.name.toLowerCase().includes(input.toLowerCase()))
  }
  
  return role
}

export function findMember (input, guildId) {
  let member = false

  if (
    input.startsWith("<@") && 
    input.endsWith(">") && 
    client.guilds.cache
      .get(guildId)
      .members
      .cache
      .find((mem) => mem.id === input.slice(2, -1))
  ) {

    member = client.guilds.cache.get(guildId)
      .members.cache
      .find((mem) => mem.id === input.slice(2, -1))

  } else if (
    input.startsWith("<@!") && 
    input.endsWith(">") && 
    client.guilds.cache
      .get(guildId)
      .members
      .cache
      .find((mem) => mem.id === input.slice(3, -1))
  ) {

    member = client.guilds.cache.get(guildId)
      .members.cache
      .find((mem) => mem.id === input.slice(3, -1))

  } else if (
    client.guilds.cache
      .get(guildId)
      .members
      .cache
      .find((mem) => mem.id === input)
  ) {

    member = client.guilds.cache
      .get(guildId)
      .members
      .cache
      .find((mem) => mem.id === input)

  } else if (
    client
      .guilds
      .cache
      .get(guildId)
      .members
      .cache
      .find((mem) => mem.user.tag.toLowerCase().includes(input.toLowerCase()))
  ) {
    member = client.guilds.cache
      .get(guildId)
      .members.cache
      .find((mem) => mem.user.tag.toLowerCase().includes(input.toLowerCase()))
  }
  
  return member
}

export async function returnBoard (boardType, guildId) {
  const guild = client.guilds.cache.get(guildId)

  if (boardType === "general") {
    const members = guild.members.cache

    return new Discord.MessageEmbed()
      .setThumbnail(guild.iconURL())
      .setTitle("General Stats")
      .addFields({
        name: "Server Info:",
        value: `**${guild.name}**\n\n**<:Boost:772548967455129630>:** ${guild.premiumSubscriptionCount}\n**Boost level:** ${guild.premiumTier}\n\n**Animated emojis:** ${guild.emojis.cache.filter((emoji) => emoji.animated).size}\n**Static emojis:** ${guild.emojis.cache.filter((emoji) => !emoji.animated).size}\n\n**Channels:** ${guild.channels.cache.filter((channel) => channel.type !== "category").size}\n**#:** ${guild.channels.cache.filter((channel) => channel.type === "text").size}\n**🔊:** ${guild.channels.cache.filter((channel) => channel.type === "voice").size}\n\n**Roles:** ${guild.roles.cache.size}\n**🔨:** ${await guild.fetchBans().catch(() => "Missing permissions").then((banned) => banned.size === undefined ? "Missing permissions" : banned.size)}`,
      }, {
        name: "Member Info:",
        value: `**All:** ${members.size}\n**👥:** ${
          members.filter((member) => !member.user.bot).size
        }\n**🤖:** ${
          members.filter((member) => member.user.bot).size
        }\n**🟢:** ${members.filter(
          (member) => member.presence.status === "online",
        ).size}  **<:DND:766073431195648050>:** ${members.filter(
          (member) => member.presence.status === "dnd",
        ).size}  **<:Idle:766481844979499008>:** ${members.filter(
          (member) => member.presence.status === "idle",
        ).size}  **<:Offline:766492789915516960>:** ${members.filter(
          (member) => member.presence.status === "offline",
        ).size}`,
      })
      .setColor("#800808")
      .setFooter("Last edited ")
  } else if (boardType === "presences") {
    const output = new Discord.MessageEmbed()
        .setTitle("Activities")
    let users = `<@${
      guild
      .presences
      .cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => [
        "PLAYING",
        "STREAMING",
        "COMPETING",
      ].includes(presence.activities[0].type))
      .map((activity) => activity.userID)
      .join(">\nsep<@")}>`

    let activity = guild.presences
      .cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => [
        "PLAYING",
        "STREAMING",
        "COMPETING",
      ].includes(presence.activities[0].type))
      .map((presence) => presence.activities[0].name),

      longActivities = activity
        .map((_activity, index) => (
          _activity.length > 45 ? index : undefined
        ))
        .filter((_activity) => _activity)

    users = users.split("sep")

    let userLength = users.length,

      offset = 1

    for (const position of longActivities) {
      users.splice(position + offset, 0, "\n")
      offset++
    }

    users = users.join("")

    activity = activity.join("\n")

    if (users === "<@>") {
      users = "Nobody"
    }

    if (!activity) {
      activity = "Nothing"
    }
    output.addFields({
      name: `Playing: ${userLength}`,
      value: users,
      inline: true,
    }, {
      name: "Game:",
      value: activity,
      inline: true,
    })

    output.addFields({
      name: "​",
      value: "-------------------------------",
    })

    users = `<@${guild.presences
      .cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => presence.activities[0].type === "LISTENING")
      .map((presence) => presence.userID)
      .join(">\nsep<@")
    }>`

    activity = guild.presences
      .cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => presence.activities[0].type === "LISTENING")
      .map((presence) => presence.activities[0].name)

    longActivities = activity
      .map((_activity, index) => (
        _activity.length > 45 ? index : undefined
      ))
      .filter((_activity) => _activity)

    users = users.split("sep")

    userLength = users.length

    offset = 1

    for (const position of longActivities) {
      users.splice(position + offset, 0, "\n")
      offset++
    }

    users = users.join("")

    activity = activity.join("\n")

    if (users === "<@>") {
      users = "Nobody"
    }

    if (!activity) {
      activity = "Nothing"
    }

    output.addFields({
      name: `Listening: ${userLength}`,
      value: users,
      inline: true,
    }, {
      name: "Song:",
      value: activity,
      inline: true,
    })

    output.addFields({
        name: "​",
        value: "-------------------------------",
      },
    )

    users = `<@${guild.presences
      .cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => presence.activities[0].type === "WATCHING")
      .map((presence) => presence.userID)
      .join(">\nsep<@")}>`

    activity = guild.presences.cache
      .filter((presence) => presence.activities[0] !== undefined)
      .filter((presence) => presence.activities[0].type === "WATCHING")
      .map((presence) => presence.activities[0].name)

    longActivities = activity
      .map((_activity, index) => (
        _activity.length > 45 ? index : undefined
      ))
      .filter((_activity) => _activity)

    users = users.split("sep")

    userLength = users.length

    offset = 1

    for (const position of longActivities) {
      users.splice(position + offset, 0, "\n")
      offset++
    }

    users = users.join("")

    activity = activity.join("\n")

    if (users === "<@>") {
      users = "Nobody"
    }

    if (!activity) {
      activity = "Nothing"
    }
    output.addFields({name: `Watching: ${userLength}`,
      value: users,
      inline: true}, {name: "Thing:",
      value: activity,
      inline: true})

    output.setColor("#800808")
    output.setFooter("Last edited ")
    
    return output
  } else if (boardType === "bots") {
    return new Discord.MessageEmbed()
      .setTitle("Bots")
      .addFields(
        {
          name: "Bot",
          value: `<@${guild.members
            .cache
            .filter((member) => member.user.bot)
            .map((member) => member.id)
            .join(">\n<@")}>` === "<@>"
              ? "No bots here!"
              : `<@${guild.members
                .cache
                .filter((member) => member.user.bot)
                .map((member) => member.id)
                .join(">\n<@")}>`,
          inline: true,
        },
        {
          name: "Status",
          value: guild.members
            .cache
            .filter((member) => member.user.bot)
            .map((member) => (
              member.presence.status === "offline"
                ? "Offline <:Offline:766492789915516960>"
                : "Online 🟢"
            )),
          inline: true,
        },

      )
      .setColor("#800808")
      .setFooter("Last edited ")
  } else if (boardType === "bot") {
    let out = new Discord.MessageEmbed()
      .setTitle("My stats")
      .addFields({
        name: "Guilds",
        value: client.guilds.cache.size
      }, {
        name: "Users",
        value: client.guilds
          .cache
          .map((_guild) => _guild.members.cache.size)
          .reduce((first, second) => first + second, 0)
      }, {
        name: "Ping",
        value: `${client.ws.ping} ms`,
      }, {
        name: "Uptime",
        value: `${Math.floor(client.uptime / 86400000)}d, ${Math.floor(client.uptime / 3600000) % 24}h, ${Math.floor(client.uptime / 60000) % 60}m, ${Math.floor(client.uptime / 1000) % 60}s`
      })
      .setColor("#800808")
      .setFooter("Last edited ")
    return out
  } else if (boardType === "gMembers") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]

    let  mongoGuild = await serverColl.findOne({_id: guild.id}),

      chd = mongoGuild.members.join(","),
      addDate = new Date(),
      chxl = []

    for (const _ of mongoGuild.members) {
      chxl.push(
        `${months[addDate.getMonth()]} ${addDate.getDate()}`
      )
      addDate.setDate(addDate.getDate() - 1)
    }

    return new Discord.MessageEmbed()
      .setImage(
        imageCharts()
          .cht("ls")
          .chd(`a:${chd}`)
          .chf("bg,s,43454d")
          .chls(5)
          .chs("700x300")
          .chts("ffffff,30,Chewy")
          .chtt("Members")
          .chxl(`0:|${chxl.join("|")}`)
          .chxs("0,ffffff|1,ffffff")
          .chxt("x,y")
          .toURL(),
      )

      .setColor("#800808")
      .setFooter("Last edited ")
    
  }
}

export function joinInterval(array, interval, joiner, otherJoiner) {
  let output = array.map(elem => elem + otherJoiner)

  for(let i = 0; i < output.length ; i += interval + 1) {
    output.splice(i, 0, joiner)
  }
  return output.join("")
}