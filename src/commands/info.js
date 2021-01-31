/**
 * StatBot
 * @copyright 2020 Daniel Zhang
 * @license BSD-3-Clause
 */
import {findChannel, findMember, findRole, joinInterval} from "../functions"
import Discord from "discord.js"
 
export default {
  name: "info",
  description: "Shows info on a server, channel, or user",
  args: 1,
  usage: "<'server' | 'channel' | 'user' | 'role'> [mention | id | name]",
  guildOnly: true,
  cooldown: 0,
  aliases: ["i"],
  async execute (message, args){
    let reply
    if (args[0] === "server" || args[0] === "s"){
      let guild = message.guild,
        features = guild.features

      reply = await new Discord.MessageEmbed()
      .setThumbnail(guild.iconURL())
      .setTitle(`Server Stats for ${guild.name}`)
      .setImage(guild.bannerURL())
      .addFields(
        {name: "Members",
          value: `**Total:** ${guild.members.cache.size}
          **👥:** ${guild.members.cache.filter((member) => !member.user.bot).size}
          **🤖:** ${guild.members.cache.filter((member) => member.user.bot).size}`
        },
        {name: "Channels", 
          value: `**Total:** ${guild.channels.cache.filter((channel) => channel.type !== "category").size}
          **Categories:** ${guild.channels.cache.filter((channel) => channel.type === "category").size}
          **#:** ${guild.channels.cache.filter((channel) => channel.type === "text").size}
          **🔊:** ${guild.channels.cache.filter((channel) => channel.type === "voice").size}
          **📢:** ${guild.channels.cache.filter((channel) => channel.type === "news").size}

          **AFK Channel:** ${guild.afkChannelID === null ? "None!" : `<#${guild.afkChannelID}>`}
          **Rules Channel:** ${guild.rulesChannelID === null ? "None!" : `<#${guild.rulesChannelID}>`}
          **Systems Channel:** ${guild.systemChannelID === null ? "None!" : `<#${guild.systemChannelID}>`}
          **Updates Channel:** ${guild.publicUpdatesChannelID === null ? "None!" : `<#${guild.publicUpdatesChannelID}>`}`
        },
        {name: "Roles", 
          value: `**Total:** ${guild.roles.cache.size}
          **Hoisted:** ${guild.roles.cache.filter(role => role.hoist).size}
          **Managed:** ${guild.roles.cache.filter(role => role.managed).size}
          **With Perms:** ${guild.roles.cache.filter(role => role.permissions.bitfield !== 0).size}
          
          **Highest:** <@&${guild.roles.highest.id}>`
        },
        {name: "Perks",
          value: `${features.includes("ANIMATED_ICON") ? "✅ Animated icon\n" : ""}${features.includes("BANNER") ? "✅ Banner\n" : ""}${features.includes("COMMERCE") ? "✅ Shop channels\n" : ""}${features.includes("COMMUNITY") ? "✅ Community server\n" : ""}${features.includes("DISCOVERABLE") ? "✅ Enabled discovery\n" : ""}${features.includes("INVITE_SPLASH") ? "✅ Invite splash\n" : ""}${features.includes("MEMBER_VERIFICATION_GATE_ENABLED") ? "✅ Member verification gate\n" : ""}${features.includes("NEWS") ? "✅ News channels\n" : ""}${features.includes("PARTNERED") ? "✅ Partnered\n" : ""}${features.includes("VANITY_URL") ? "✅ Vanity URL\n" : ""}${features.includes("VERIFIED") ? "✅ Verified\n" : ""}${features.includes("WELCOME_SCREEN_ENABLED") ? "✅ Welcome screen\n" : ""}` || "None"},
        {name: "Other",
          value: `**Verification level:** ${guild.verificationLevel}
          **Media filter level:** ${guild.explicitContentFilter.replace(/_/g, " ")}

          **Shard:** ${guild.shardID}

          **Description:** ${guild.description || "None"}`
        }
      )
      .setFooter("Created at ")
      .setTimestamp(guild.createdAt)

      message.channel.send(reply)
    } else if (args[0] === "channel" || args[0] === "c") {
      let channel
      args.length <= 1 ? 
      channel = message.channel : 
      channel = await findChannel(args[1], message.guild.id) || message.channel

      reply = new Discord.MessageEmbed()
        .setTitle(`Channel stats for ${channel.name}`)
        .setDescription(`**Type:** ${channel.type}
        
        **Category:** ${channel.parentID ? `<#${channel.parentID}>`: "None"}

        **Position:** ${channel.rawPosition}

        **Cooldown:** ${channel.rateLimitPerUser}

        **Viewable by:** ${message.guild.members.cache.filter(user => user.permissionsIn(channel).serialize().VIEW_CHANNEL).size}
        
        **Overwrites:** ${channel.permissionOverwrites.size}
        
        **Typing:** ${channel.typing ? channel.typing.map(user => "<@" + user.user.id + ">") : "Nobody"}`)
        .setFooter("Created at ")
        .setTimestamp(channel.createdAt)

        message.channel.send(reply)
    } else if (args[0] === "user" || args[0] === "u") {
      let member
      args.length <= 1 ? 
      member = message.guild.members.cache.get(message.author.id) : 
      member = await findMember(args[1], message.guild.id) || message.guild.members.cache.get(message.author.id)

      let user = member.user,
        statusEmotes = {
          online: "🟢",
          idle: "<:Idle:766481844979499008>",
          dnd: "<:DND:766073431195648050>",
          offline: "<:Offline:766492789915516960>",
        }

      reply = new Discord.MessageEmbed()
      .setThumbnail(user.displayAvatarURL())
      .setTitle(`Showing stats for ${user.tag} (${member.nickname || "No nickname"}) (${user.id})`)
      .setDescription(`
        **Type:** ${user.bot ? "Bot" : "Human"}
        **Badges:** ${user.flags ? user.flags.toArray().join(", ").replace(/_/g, " ") : "None!"}
        **Status:** ${statusEmotes[user.presence.status]}
        **Activities:** ${user.presence.activities.map(pre => pre.type === "CUSTOM_STATUS" ? ` ${pre.emoji || ""} ${pre.state}` : ` ${pre.type}: ${pre.name}`) || "None"}
      `)
      .addFields(
        {name: `Server info`, value: `
          **Joined:** ${member.joinedAt}

          **Highest role:** ${member.roles.highest}

          **Hoisted role:** ${member.roles.hoist}

          **Colour role:** ${member.roles.color}

          **Last sent message in:** <#${member.lastMessageChannelID}>

          **[Last message](https://discord.com/channels/${member.guild.id}/${member.lastMessageChannelID}/${member.lastMessageID})**
        `}
      )
      .setColor(member.roles.highest.hexColor)
      .setFooter("Created at ")
      .setTimestamp(user.createdAt)

      message.channel.send(reply)
    } else if ((args[0] === "role" && args.length > 1) || (args[0] === "r" && args.length > 1)) {
      let role = await findRole(args[1], message.guild.id)

      if (!role) return message.channel.send("That's not a role...")
      
      reply = new Discord.MessageEmbed()
        .setTitle(`Showing stats for ${role.name} (${role.id})`)
        .setDescription(`
          **Position:** ${message.guild.roles.cache.size - role.position}

          **Colour:** ${role.hexColor}

          **Hoist:** ${role.hoist}

          **Mentionable:** ${role.mentionable}

          **Members:** ${role.members.size}
        `)
        .addFields(
          {name: "Permissions", value: joinInterval(role.permissions.toArray(), 3, "\n", ", ").replace(/_/g, " ") || "NONE"}
        )
        .setColor(role.hexColor)
        .setFooter("Created at ")
        .setTimestamp(role.createdAt)

      message.channel.send(reply)
    } else {
      message.channel.send("You didn't use this command correctly!")
    }
  }
}
