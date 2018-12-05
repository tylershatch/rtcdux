/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

import { Room } from "./Room";
import { RemoteMediaManager } from "./RemoteMedia";
import { SfuUpstreamManager } from "./SfuUpstream";

export namespace SfuDownstreamManager {
  enum State {
    NoUpstream,
    Open,
    Opening,
    Closing,
    Closed,
  }

  var _connections: {
    [mediaId: string] : {
      rawConnection: fm.liveswitch.SfuDownstreamConnection, 
      state: State 
    }
  } = {};
  
  export var stateChanged = new Event<{mediaId: string, state: State}>();

  export function Init() {
    SfuUpstreamManager.remoteOpened.on(({clientId, payload}) => {
      let mediaId = payload;
      let oldState = _connections[mediaId].state;

      // We had no upstream, but now we do, so we are 'Closed' and ready to be opened
      ChangeState(mediaId, State.Closed);

      // If our previous state was 'Open' or 'Opening', reconnect using the new upstream
      if (oldState == State.Open || oldState == State.Opening) {
        Open(mediaId);
      }
    });

    SfuUpstreamManager.remoteClosed.on(({clientId, payload}) => {
      let mediaId = payload;

      // Unhook the state change callback for our now unusable raw downstream connection
      let rawConnection = _connections[mediaId].rawConnection;
      if (rawConnection != null) {
        rawConnection.removeOnStateChange(() => HandleRawConnectionStateChange(mediaId, rawConnection));
      }

      ChangeState(mediaId, State.NoUpstream);
    })
  }

  export function Create(mediaId: string) {
    _connections[mediaId] = {
      rawConnection: null,
      state: State.NoUpstream
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
      throw new Error("rtc SfuDownstreamManager.Open error: can't open connection for mediaId=" + mediaId + " when state is=" + state);
    }

    // Create a new raw connection
    let remoteMedia = RemoteMediaManager.GetMedia(mediaId);
    let rawConnection = Room.Get().createSfuDownstreamConnection(
      mediaId,
      new fm.liveswitch.AudioStream(null, remoteMedia), 
      new fm.liveswitch.VideoStream(null, remoteMedia));
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
      throw new Error("rtc SfuDownstreamManager.Close error: can't close connection for mediaId=" + mediaId + " when in state=" + _connections[mediaId].state);
    }

    // Close the raw connection
    connection.rawConnection.close();
  }

  function ChangeState(mediaId: string, state: State) {
    _connections[mediaId].state = state;
    stateChanged.emit({mediaId, state});
  }

  function HandleRawConnectionStateChange(mediaId: string, rawConnection: fm.liveswitch.SfuDownstreamConnection) {
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

// require("./vendor/fm.liveswitch.js");

// import { Event } from "ts-typed-events";

// import { Room } from "./Room";
// import { LocalMediaManager } from "./LocalMedia";
// import { RemoteEventManager } from "./RemoteEvents";
// import { RemoteMediaManager } from "./RemoteMedia";
// import { SfuUpstreamManager } from "./SfuUpstream";

// export namespace SfuDownstreamManager {
//   enum State {
//     NotReady,
//     Open,
//     Opening,
//     Closing,
//     Closed,
//   }

//   class SfuDownstream {
//     connectionId: string;
//     state: State;
//   }

//   var _connections: {[mediaId: string] : {connectionId: string, state: State }} = {};
//   var _rawConnections: {[connectionId: string] : {mediaId: string, upstream: fm.liveswitch.ConnectionInfo, downstream: fm.liveswitch.SfuDownstreamConnection});
  
//   export var created = new Event<string>();
//   export var destroyed = new Event<string>();
//   export var stateChanged = new Event<{mediaId: string, state: State}>();
  
//   function CreateRawConnectionIfNeeded(connectionId: string) {
//     if (!(connectionId in _rawConnections)) {
//       _rawConnections[connectionId] = {
//         mediaId: null, 
//         upstream: null,
//         downstream: null};
//     }
//   }

//   // TODO revisit this, apparently there is an overload for creating a downstream sfu connection using the remote mediaId,
//   // rather than with the connectionInfo provided by addOnRemoteUpstreamConnectionOpen, in which case we don't
//   // need to handle that callback at all and things get a lot simpler
//   export function Init() {
//     Room.get().addOnRemoteUpstreamConnectionOpen(connectionInfo => {
//       var connectionId = connectionInfo.getId();
//       CreateRawConnectionIfNeeded(connectionId);
//       _rawConnections[connectionId].upstream = connectionInfo;

//       // If we already have a mediaId for this upstream, 
//       // than we are ready to open the associated downstream
//       var mediaId = _rawConnections[connectionId].mediaId;
//       if (mediaId != null) {
//         ChangeState(mediaId, State.Closed);
//       }
//     });

//     SfuUpstreamManager.remoteOpened.on(({clientId, payload}) => {
//       var mediaId = payload.mediaId;
//       var connectionId = payload.connectionId;
//       CreateRawConnectionIfNeeded(connectionId);
//       _rawConnections[connectionId].mediaId = mediaId;

//       // If we already have connection info for this upstream, 
//       // than we are ready to open the associated downstream
//       if (_rawConnections[connectionId].upstream != null) {
//         ChangeState(mediaId, State.Closed);
//       }
//     });
//   }

//   export function Create(mediaId: string) {
//     _connections[mediaId] = {
//       connectionId: null,
//       state: State.NotReady
//     };
//     created.emit(mediaId);
//   }

//   export function Destroy(mediaId: string) {
//     delete _connections[mediaId];
//     destroyed.emit(mediaId);
//   }

//   export function Open(mediaId: string) {
//     var connection = _connections[mediaId];
//     var connectionId = connection.connectionId;
//     var state = connection.state;

//     if (state !== State.Closing && state !== State.Closed) {
//       throw new Error("rtc SfuDownstreamManager.Open error: can't open connection for mediaId=" + mediaId + " when state is=" + state);
//     }

//     let remoteMedia = RemoteMediaManager.getMedia(mediaId);
//     let rawConnection = Room.get().createSfuDownstreamConnection(
//       _rawConnections[connectionId].upstream,
//       new fm.liveswitch.AudioStream(null, remoteMedia), 
//       new fm.liveswitch.VideoStream(null, remoteMedia));
//     _rawConnections[connectionId].downstream = rawConnection;
  
//     rawConnection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);
//     rawConnection.addOnStateChange(() => {

//     });

//     _connections[mediaId].connectionId = connectionId;
//     ChangeState(mediaId, State.Opening);
//     rawConnection.open();
//   }

//   export function Close(mediaId: string) {
//     var connection = _connections[mediaId];
//     var connectionId = connection.connectionId;
//     var state = connection.state;

//     if (state !== State.Opening && state !== State.Open) {
//       throw new Error("rtc SfuUpstreamStableManager.Close error: can't close connection for mediaId=" + mediaId + " when in state=" + _connections[mediaId].state);
//     }

//     _rawConnections[connectionId].downstream.close();
//   }

//   function ChangeState(mediaId: string, state: State) {
//     _connections[mediaId].state = state;
//     stateChanged.emit({mediaId, state});
//   }
// } 