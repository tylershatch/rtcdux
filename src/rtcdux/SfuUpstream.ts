/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

import { Room } from "./Room";
import { LocalMediaManager } from "./LocalMedia";
import { RemoteEventManager } from "./RemoteEvents";

export namespace SfuUpstreamManager {
  enum State {
    Open,
    Opening,
    Closing,
    Closed,
  }

  var _connections: {
    [mediaId: string] : {
      rawConnection: fm.liveswitch.SfuUpstreamConnection, 
      state: State 
    }
  } = {};
  
  export var stateChanged = new Event<{mediaId: string, state: State}>();
  export var remoteOpened = new Event<{clientId: string, payload: string}>();
  export var remoteClosed = new Event<{clientId: string, payload: string}>();

  export function Init() {
    RemoteEventManager.Bind(remoteOpened);
    RemoteEventManager.Bind(remoteClosed);

    LocalMediaManager.captureResolved.on(mediaId => {
      Create(mediaId);
      Open(mediaId);
    });

    LocalMediaManager.releaseResolved.on(mediaId => {
      Close(mediaId);
      Destroy(mediaId)
    });
  }

  export function Create(mediaId: string) {
    _connections[mediaId] = {
      rawConnection: null,
      state: State.Closed
    };
  }

  export function Destroy(mediaId: string) {
    delete _connections[mediaId];
  }

  export function Open(mediaId: string) {
    var connection = _connections[mediaId];
    var state = connection.state;

    // Make sure we are in a valid state before doing anything
    if (state !== State.Closing && state !== State.Closed) {
      throw new Error("rtc SfuUpstreamManager.Open error: can't open connection with state=" + _connections[mediaId].state);
    }

    // If there is already a raw connection for this stable connection, unhook its state change callback
    let oldRawConnection = _connections[mediaId].rawConnection;
    if (oldRawConnection != null) {
      oldRawConnection.removeOnStateChange(() => HandleRawConnectionStateChange(mediaId, oldRawConnection));
    }
    
    // Create a new raw connection
    let localMedia = LocalMediaManager.GetMedia(mediaId);
    let rawConnection = Room.Get().createSfuUpstreamConnection(
      new fm.liveswitch.AudioStream(localMedia, null), 
      new fm.liveswitch.VideoStream(localMedia, null));
    _connections[mediaId].rawConnection = rawConnection;
    rawConnection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);

    // Hook up its state change callback
    rawConnection.addOnStateChange(() => HandleRawConnectionStateChange(mediaId, rawConnection));

    // Open the raw connection
    ChangeState(mediaId, State.Opening);
    rawConnection.open();
  }

  export function Close(mediaId: string) {
    var connection = _connections[mediaId];
    var state = connection.state;

    // Make sure we are in a valid state before doing anything
    if (state !== State.Opening && state !== State.Open) {
      throw new Error("rtc SfuUpstreamManager.Close error: can't open connection with state=" + state);
    }

    // Close the raw connection
    connection.rawConnection.close();
  }

  function ChangeState(mediaId: string, state: State) {
    switch (state) {
      case State.Open: {
        RemoteEventManager.Broadcast(remoteOpened, mediaId);
        break;
      }
      case State.Closed: {
        RemoteEventManager.Broadcast(remoteClosed, mediaId);
      }
    }

    _connections[mediaId].state = state;
    stateChanged.emit({mediaId, state});
  }

  // TOOD this wound up being, surprisingly, a carbon copy of SfuUpstreamManager.HandleRawConnectionStateChange
  // need to de-duplicate
  function HandleRawConnectionStateChange(mediaId: string, rawConnection: fm.liveswitch.SfuUpstreamConnection) {
    var rawState = rawConnection.getState();

    switch(rawState) {
      // If the raw connection is now connected
      case fm.liveswitch.ConnectionState.Connected: {
        // It should be impossible for the stable connection to be in any state other than 'Opening'
        if (_connections[mediaId].state != State.Opening) {
          throw new Error("Impossible!");
        }
        ChangeState(mediaId, State.Open);
        break;
      }

      // If the raw connection is now closed
      case fm.liveswitch.ConnectionState.Closed: {
        // It should be impossible for the stable connection to be in any state other than 'Closing'
        if (_connections[mediaId].state != State.Closing) {
          throw new Error("Impossible!");
        }
        ChangeState(mediaId, State.Closed);
        break;
      }

      // If the raw connection is now failed
      case fm.liveswitch.ConnectionState.Failed: {
        var stableState = _connections[mediaId].state;
        // It should be impossible for the stable connection to be in the state 'Closed'
        if (_connections[mediaId].state == State.Closed) {
          throw new Error("Impossible!");
        }
        // If the raw connection state is 'Failed', the stable connection state should now be 'Closed'
        ChangeState(mediaId, State.Closed);
        // If the stable connection state was 'Open' or 'Opening', then we should try to reconnect
        if (stableState == State.Opening || stableState == State.Open) {
          Open(mediaId);
        }
        break;
      }
    }
  }
}