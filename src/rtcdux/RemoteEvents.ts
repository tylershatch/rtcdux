/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

import { Room } from "./Room";
import { RemoteClientManager } from "./RemoteClients";

interface RemotePayload<Payload> {
  clientId: string;
  payload: Payload;
}

export namespace RemoteEventManager {     
  abstract class RemoteEventBase {
    abstract on(payload: any): void;
  }

  // Class for emitting and listening for events from remote clients in a typed way
  class RemoteEvent<Payload> extends RemoteEventBase {
    _localEvent: Event<RemotePayload<Payload>>;

    constructor(localEvent: Event<RemotePayload<Payload>>) {
      super();
      this._localEvent = localEvent;
    }

    on(payload: RemotePayload<Payload>) {
      this._localEvent.emit(payload);
    }
  }

  // Registered listeners for remotely emitted events
  var _boundEvents : {[event:string]: RemoteEventBase} = {};

  export function Init() {
    // Whenever we receive a remote event
    Room.Get().addOnClientMessage((clientInfo: fm.liveswitch.ClientInfo, message: string) => {
      // Parse it and emit the associated local event
      let json = JSON.parse(message);
      _boundEvents[json.event].on({
        "clientId": clientInfo.getId(),
        "payload": json.payload
      });
    });
  }

  // Emit an event on a remote client
  export function Emit<Payload>(event: Event<RemotePayload<Payload>>, clientId: string, payload: Payload) {
    var clientInfo = RemoteClientManager.GetClient(clientId);
    Room.Get().sendClientMessage(
      clientInfo.getUserId(), 
      clientInfo.getDeviceId(), 
      clientId, 
      JSON.stringify({
        "event": event,
        "payload": payload
      })
    );
  }

  // Emit an event on all remote clients
  export function Broadcast<Payload>(event: Event<RemotePayload<Payload>>, payload: Payload) {
    for (var clientId in RemoteClientManager.GetClientIds()) {
      Emit(event, clientId, payload);
    }
  }

  // Called during application start up to bind a local event so that it can be emitted remotely
  export function Bind<Payload>(event: Event<RemotePayload<Payload>>) {
    _boundEvents[JSON.stringify(event)] = new RemoteEvent<Payload>(event);
  }
}