/**
 * StatBot
 * @copyright 2020-2021 Daniel Zhang
 * @license BSD-3-Clause
 */

import {
  client,
  connection,
  serverColl,
  serverList
} from "./index.mjs"

import {returnBoard} from "./functions.mjs"

let serverArray,
  iteration = 0,
  newBoard,
  lastDate = new Date()

const cache = {}

export default async function loop () {
  await connection

  console.log("loop ready")
  while (true) {
    const serverArrayColl = await serverList.findOne({_id: "0"})

    serverArray = serverArrayColl.servers

    for (let serverId of serverArray) {
      let server = await serverColl.findOne({_id: serverId})
  
      if (!(iteration % server.cooldown)) {
        const serverStatBoards = server.statboards

        if (cache[serverId] === undefined) {
          cache[serverId] = {
            boards: {
              general: await returnBoard("general", serverId),
              presences: await returnBoard("presences", serverId),
              bots: await returnBoard("bots", serverId),
            },
          }
        }
  
        for (const statBoard of serverStatBoards) {

          const place = serverStatBoards.indexOf(statBoard)
          
          switch (statBoard) {
          case 0:
            newBoard = await returnBoard("general", serverId)

            if (
              JSON.stringify(cache[serverId]
              .boards
              .presences)
              !== JSON.stringify(newBoard)
            ) {

              cache[serverId].boards.general = newBoard

              newBoard.setTimestamp()

              client
                .guilds
                .cache
                .get(serverId)
                .channels
                .cache
                .get(server.channel)
                .messages
                .fetch(server.messages[place])
                .then((msg) => {
                  msg.edit(newBoard).catch()
                })
                  
            }
            break

          case 1:
            newBoard = await returnBoard("presences", serverId)

            if (
              JSON.stringify(cache[serverId]
                .boards
                .presences
                ) 
              !== JSON.stringify(newBoard)
            ) {

              cache[serverId].boards.presences = newBoard

              newBoard.setTimestamp()

              client
                .guilds
                .cache
                .get(serverId)
                .channels
                .cache
                .get(server.channel)
                .messages
                .fetch(server.messages[place])
                .then((msg) => {
                  msg.edit(newBoard).catch()
                })
            }
            break


          case 2:
            newBoard = await returnBoard("bots", serverId)
  
            if (
              JSON.stringify(cache[serverId]
                .boards
                .bots) !== JSON.stringify(newBoard)) {
  
              cache[serverId].boards.bots = newBoard
  
              newBoard.setTimestamp()
  
              client
                .guilds
                .cache
                .get(serverId)
                .channels
                .cache
                .get(server.channel)
                .messages
                .fetch(server.messages[place])
                .then((msg) => {
                  msg.edit(newBoard).catch()
                })
            }
            break
                
          case 3:
            newBoard = await returnBoard("bot", serverId)

            newBoard.setTimestamp()

            client
              .guilds
              .cache
              .get(serverId)
              .channels
              .cache
              .get(server.channel)
              .messages
              .fetch(server.messages[place])
              .then((msg) => {
                msg.edit(newBoard).catch()
              })
            
            break
          default:
            break
          }
        }
      }
    }


    if (lastDate.getDate() !== new Date().getDate()) {

      lastDate = new Date()

      for (let serverId of serverArray) {
        let server = await serverColl.findOne({_id: serverId})

        if ("members" in server) {

          if (server.members.length === 7) {
            serverColl.updateOne({_id: serverId}, {$pop: {members: -1}})
          }

          serverColl
          .updateOne(
            {_id: serverId},
            {$push: {members: client
              .guilds
              .cache
              .get(serverId)
              .members
              .cache
              .size
            }}
          )

          newBoard = await returnBoard("gMembers", serverId)

          newBoard.setTimestamp()

          client
            .guilds
            .cache
            .get(serverId)
            .channels
            .cache
            .get(server.channel)
            .messages
            .fetch(server.messages[
            server.statboards.indexOf("90")])
            .then((msg) => {
              msg.edit(newBoard).catch()
            })

        }
      }
    }


    iteration++
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000)
    })
  }
}
