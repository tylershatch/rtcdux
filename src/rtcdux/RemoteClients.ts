/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

import { Room } from "./Room";

export namespace RemoteClientManager {
  // The remote client list itself
  var _clientList: {[index:string] : fm.liveswitch.ClientInfo} = {};
  export function GetClientIds() { return Object.keys(_clientList); };
  export function GetClient(clientId: string) { return _clientList[clientId]; }

  // Events emitted when remote clients join/leave
  export var clientJoined = new Event<string>();
  export var clientLeft = new Event<string>();

  // Initialization function for adding event handlers
  export function Init() {
    // Whenever we join a room
    Room.joinResolved.on((room) => {

      // Add all of its clients to the remote client list
      
      var clientInfos = room.getRemoteClientInfos();
      for (var i in clientInfos) {
        var clientInfo = clientInfos[i];
        var clientId = clientInfo.getId();
        _clientList[clientId] = clientInfo;
        clientJoined.emit(clientId);
      }

      // Add remote client leave/join event handlers 

      room.addOnRemoteClientJoin((clientInfo) => {
        var clientId = clientInfo.getId();
        _clientList[clientId] = clientInfo;
        clientJoined.emit(clientId);
      })

      room.addOnRemoteClientJoin((clientInfo) => {
        var clientId = clientInfo.getId();
        delete _clientList[clientId];
        clientLeft.emit(clientId);
      })
    });

    // Whenever we leave a room, remove all clients from the remote client list
    Room.leaveResolved.on(() => {
      for (var clientId in _clientList) {
        clientLeft.emit(clientId);
      }
      _clientList = {};
    })
  }
}