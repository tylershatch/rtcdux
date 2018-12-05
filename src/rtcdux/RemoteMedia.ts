/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

import { RemoteClientManager } from "./RemoteClients";
import { LocalMediaManager } from "./LocalMedia";
import { RemoteEventManager } from "./RemoteEvents";
import { Room } from "./Room";

export namespace RemoteMediaManager {  
  var _mediaList: {[index:string] : {clientId: string, media: fm.liveswitch.RemoteMedia}} = {};
  
  export function GetMedia(mediaId: string) {
    return _mediaList[mediaId].media;
  }

  export function GetClientId(mediaId: string) {
    return _mediaList[mediaId].clientId;
  }

  // Remotely emitted events indicating remote media was captured/released
  var captured = new Event<{clientId: string, payload: string}>();
  var released = new Event<{clientId: string, payload: string}>();

  // Locally emitted events indicating our local representation of remote media has been created/destroyed
  export var created = new Event<string>();
  export var destroyed = new Event<string>();

  export function Init() {
    // Bind remotely emitted events
    RemoteEventManager.Bind(captured);
    RemoteEventManager.Bind(released);

    // Whenever a client joins, tell it to about all our captured media
    // NOTE: there is no equivelent for clientLeft, as the client has left
    // and therefore already destroyed all of its remote media
    RemoteClientManager.clientJoined.on((clientId) => {
      for (var mediaId in LocalMediaManager.GetMediaIds()) {
        RemoteEventManager.Emit(captured, clientId, mediaId);
      }
    });

    // Whenever a local media is captured/destroyed, tell all clients
    LocalMediaManager.captureResolved.on(mediaId => RemoteEventManager.Broadcast(captured, mediaId));
    LocalMediaManager.releaseResolved.on(mediaId => RemoteEventManager.Broadcast(released, mediaId));

    // Whenever a remote media is captured, create an associated local representation
    captured.on(({clientId, payload}) => {
      var mediaId = payload;
      _mediaList[mediaId] = {
        clientId,
        media: new fm.liveswitch.RemoteMedia(),
      }
      created.emit(mediaId);
    })

    // Whenever a remote media is released, destroy its associated local representation
    released.on(({clientId, payload}) => {
      var mediaId = payload;
      delete _mediaList[mediaId];
      destroyed.emit(mediaId);
    })

    // Whenever we leave a room, destroy all remote media
    Room.leaveResolved.on(() => {
      // Destroy all remote media
      for (var mediaId in _mediaList) {
        destroyed.emit(mediaId);
      }
      _mediaList = {};
    });
  }
}