/**
 * StatBot
 * @copyright 2020 Daniel Zhang
 * @license BSD-3-Clause
 */

import Discord from "discord.js"
export default {
  name: "invite",
  description: "Send the link to add this bot to your server",
  args: 0,
  guildOnly: false, 
  cooldown: 3, 
  aliases: ["inv"],
  execute (message, args) {
    const reply = new Discord.MessageEmbed()
      .setTitle("My invite link")
      .setURL("https://discord.com/oauth2/authorize?client_id=764276231805075456&scope=bot&permissions=268823636")
      .setDescription("[Admin link](https://discord.com/oauth2/authorize?client_id=764276231805075456&scope=bot&permissions=8)\n[No perms link](https://discord.com/oauth2/authorize?client_id=764276231805075456&scope=bot)\n[Support server](https://discord.gg/tvCmtkBAkc)")

    message.channel.send(reply)
  },
}
