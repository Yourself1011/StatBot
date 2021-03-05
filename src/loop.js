/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import { client, connection, serverColl, serverList } from "./index";

import Discord from "discord.js";

import { returnBoard } from "./functions";

let serverArray,
  iteration = 0,
  newBoard,
  lastDate = new Date();

const cache = {};

export default async function loop() {
  await connection;

  console.log("Loop ready");
  while (true) {
    const serverArrayColl = await serverList.findOne({ _id: "0" });

    serverArray = serverArrayColl.servers;

    for (let serverId of serverArray) {
      let server = await serverColl.findOne({ _id: serverId });
      let guild = client.guilds.cache.get(serverId);

      if (!server || !guild) {
        await serverList.updateOne(
          { _id: "0" },
          { $pull: { servers: serverId } }
        );
        continue;
      }
      

      if (!guild.members.cache.get(client.user.id)) {
        serverColl.removeOne({ _id: guild.id });
        serverList.updateOne({ _id: "0" }, { $pull: { servers: guild.id } });
        continue;
      }

      if (!server.channel) continue

      if (!(iteration % server.cooldown)) {

        if (cache[serverId] === undefined) {
            cache[serverId] = {
              boards: {
                general: await returnBoard("general", serverId),
                presences: await returnBoard("presences", serverId),
                bots: await returnBoard("bots", serverId)
              }
            };
        }

        for (const statBoard of server.statboards) {
          const place = server.statboards.indexOf(statBoard);

          (async () => {
            switch (statBoard) {
              case 0:
                newBoard = await returnBoard("general", serverId);

                if (
                  JSON.stringify(cache[serverId].boards.presences) !==
                  JSON.stringify(newBoard)
                ) {
                  cache[serverId].boards.general = newBoard;

                  newBoard.setTimestamp();

                  await client.channels
                    .get(server.channel)
                    .messages.fetch(server.messages[place])
                    .then((msg) => {
                      msg.edit(newBoard);
                    });
                }
                break;

              case 1:
                newBoard = await returnBoard("presences", serverId);

                if (
                  JSON.stringify(cache[serverId].boards.presences) !==
                  JSON.stringify(newBoard)
                ) {
                  cache[serverId].boards.presences = newBoard;

                  newBoard.setTimestamp();

                  await client.channels
                    .get(server.channel)
                    .messages.fetch(server.messages[place])
                    .then((msg) => {
                      msg.edit(newBoard);
                    });
                }
                break;

              case 2:
                newBoard = await returnBoard("bots", serverId);

                if (
                  JSON.stringify(cache[serverId].boards.bots) !==
                  JSON.stringify(newBoard)
                ) {
                  cache[serverId].boards.bots = newBoard;

                  newBoard.setTimestamp();

                  await client.channels
                    .get(server.channel)
                    .messages.fetch(server.messages[place])
                    .then((msg) => {
                      msg.edit(newBoard);
                    });
                }
                break;

              case 3:
                newBoard = await returnBoard("bot", serverId);

                newBoard.setTimestamp();

                await client.channels
                  .get(server.channel)
                  .messages.fetch(server.messages[place])
                  .then((msg) => {
                    msg.edit(newBoard);
                  });

                break;
              default:
                break;
            }
          })().catch(async (err) => {
            if (err.message === "Unknown Message") {
              guild.members.cache.get(guild.ownerID).then((owner) => {
                owner.user.send(
                  new Discord.MessageEmbed()
                    .setTitle("Deleted statboard")
                    .setDescription(
                      `I've detected that you deleted a statboard, specifically the one with the id ${statBoard}. I have removed it from my database.`
                    )
                );
              });
              await serverColl.updateOne(
                { _id: serverId },
                {
                  $pull: {
                    statboards: statBoard,
                    messages: server.messages[place]
                  }
                }
              );
            } else {
              console.error({ err });
            }
          });
        }
      }
    }

    if (lastDate.getDate() !== new Date().getDate()) {
      lastDate = new Date();

      for (let serverId of serverArray) {
        let server = await serverColl.findOne({ _id: serverId });

        if (!server) continue;

        (async () => {
          if (server.statboards.includes(90)) {
            if (server.members.length === 7) {
              await serverColl.updateOne(
                { _id: serverId },
                { $pop: { members: -1 } }
              );
            }

            await serverColl.updateOne(
              { _id: serverId },
              {
                $push: {
                  members: client.guilds.cache.get(serverId).members.cache.size
                }
              }
            );

            newBoard = await returnBoard("gMembers", serverId);

            newBoard.setTimestamp();

            client.channels.get(server.channel)
              .messages.fetch(server.messages[server.statboards.indexOf(90)])
              .then((msg) => {
                msg.edit(newBoard).catch();
              });
          }
        })().catch(async (err) => {
          if (err.message === "Unknown Message") {
            let guild = client.guilds.cache.get(serverId);
            guild.members.cache.get(guild.ownerID).then((owner) => {
              owner.user.send(
                new Discord.MessageEmbed()
                  .setTitle("Deleted statboard")
                  .setDescription(
                    `I've detected that you deleted a statboard, specifically the one with the id 90. I have removed it from my database.`
                  )
              );
            });
            await serverColl.updateOne(
              { _id: serverId },
              {
                $pull: {
                  statboards: 90,
                  messages: server.messages[server.statboards.indexOf(90)]
                }
              }
            );
          } else {
            console.error(err);
          }
        });
      }
    }

    if (!(iteration % 1800) && process.env.NODE_ENV === "prod") {
      const fetch = await require("node-fetch");

      const response = await fetch(
        "https://discordbotlist.com/api/v1/bots/764276231805075456/stats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.DBL_TOKEN
          },
          body: JSON.stringify({
            guilds: client.guilds.cache.size,
            users: client.guilds.cache
              .map((_guild) => _guild.members.cache.size)
              .reduce((first, second) => first + second, 0)
          })
        }
      );

      console.log(response.status, await response.json());
    }

    iteration++;
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }
}
