import { ActionType } from './action-types';
import { Liveswitch } from './liveswitch';

function makeActionCreator(type, ...argNames) {
  return function (...args) {
    const action = { type }
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index]
    })
    return action
  }
}

const CONNECTION_STATES = {
  [window.fm.liveswitch.ConnectionState.New]:           'NEW',
  [window.fm.liveswitch.ConnectionState.Initializing]:  'INITIALIZING',
  [window.fm.liveswitch.ConnectionState.Connecting]:    'CONNECTING',
  [window.fm.liveswitch.ConnectionState.Connected]:     'CONNECTED',
  [window.fm.liveswitch.ConnectionState.Closing]:       'CLOSING',
  [window.fm.liveswitch.ConnectionState.Closed]:        'CLOSED',
  [window.fm.liveswitch.ConnectionState.Failing]:       'FAILING',
  [window.fm.liveswitch.ConnectionState.Failed]:        'FAILED',
}

export const ActionCreator = {

  ChannelJoinResolve: function(dispatch, channel) {
    Liveswitch.channel = channel;
    
    let remoteClientInfos = channel.getRemoteClientInfos()
    for (let i in remoteClientInfos) {
      dispatch(ActionCreator.RemoteClientCreate(remoteClientInfos[i]));
    }

    channel.addOnRemoteClientJoin((remoteClientInfo) => {
      dispatch(ActionCreator.RemoteClientCreate(remoteClientInfo));
    });

    channel.addOnRemoteClientLeave((remoteClientInfo) => {
      dispatch(ActionCreator.RemoteClientDestroy(remoteClientInfo.getId()));
    });

    channel.addOnClientMessage((remoteClientInfo, message) => {
      let remoteAction = JSON.parse(message);
      let actionCreator = ActionCreator[remoteAction.actionCreator];
      let actionCreatorArgs = remoteAction.actionCreatorArgs;
      dispatch(actionCreator(...actionCreatorArgs));
    });

    channel.addOnRemoteUpstreamConnectionOpen((remoteConnectionInfo) => {
      if (remoteConnectionInfo.getType() === "sfu") {
        dispatch(ActionCreator.SfuRemoteUpstreamCreate(remoteConnectionInfo));
      }
    });

    return {type: ActionType.ChannelJoinResolve};
  },

  RemoteClientCreate: function(remoteClientInfo) {
    let remoteClientId = remoteClientInfo.getId();
    Liveswitch.remoteClientList[remoteClientId] = remoteClientInfo;

    return {type: ActionType.RemoteClientCreate, remoteClientId};
  },

  RemoteClientDestroy: function(remoteClientId) {
    delete Liveswitch.remoteClientList[remoteClientId];

    return {type: ActionType.RemoteClientDestroy, remoteClientId};
  },

  RemoteMediaCreate: function(mediaId, name, remoteClientId, sfuConnectionId) {
    let remoteMedia = new window.fm.liveswitch.RemoteMedia();
    Liveswitch.remoteMediaList[mediaId] = remoteMedia;

    return {type: ActionType.RemoteMediaCreate, mediaId, name, remoteClientId, sfuConnectionId};
  },
  
  RemoteMediaDestroy: function(mediaId) {
    delete Liveswitch.remoteMediaList[mediaId];

    return {type: ActionType.RemoteMediaDestroy, mediaId};
  },
  
  SfuLocalUpstreamCreate: function(dispatch, mediaId) {
    let localMedia = Liveswitch.localMediaList[mediaId];
    let localAudioStream = new window.fm.liveswitch.AudioStream(localMedia, null);
    let localvideoStream = new window.fm.liveswitch.VideoStream(localMedia, null); 
    let connection = Liveswitch.channel.createSfuUpstreamConnection(localAudioStream, localvideoStream);
  
    let connectionId = connection.getId();
    Liveswitch.sfuLocalUpstreamList[connectionId] = {mediaId, connection};

    connection.setIceServers([new window.fm.liveswitch.IceServer("stun.l.google.com:19302")]);
    connection.addOnStateChange(() => {
      dispatch(ActionCreator.SfuLocalUpstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
    });
  
    return {type: ActionType.SfuLocalUpstreamCreate, connectionId, mediaId};
  },
  
  SfuLocalUpstreamDestroy: function(connectionId) {
    delete Liveswitch.sfuLocalUpstreamList[connectionId];

    return {type: ActionType.SfuLocalUpstreamDestroy, connectionId};
  },

  SfuRemoteUpstreamCreate: function(remoteConnectionInfo) {
    let connectionId = remoteConnectionInfo.getId();
    let remoteClientId = remoteConnectionInfo.getClientId();
    Liveswitch.sfuRemoteUpstreamList[connectionId] = remoteConnectionInfo;

    return {type: ActionType.SfuRemoteUpstreamCreate, connectionId, remoteClientId};
  },

  SfuRemoteUpstreamDestroy: function(connectionId) {
    delete Liveswitch.sfuRemoteUpstreamList[connectionId];

    return {type: ActionType.SfuRemoteUpstreamDestroy, connectionId};
  },

  SfuDownstreamCreate: function(dispatch, connectionId, mediaId, remoteClientId) {
    let remoteMedia = Liveswitch.remoteMediaList[mediaId];
    let connection = Liveswitch.channel.createSfuDownstreamConnection(
      Liveswitch.sfuRemoteUpstreamList[connectionId],
      new window.fm.liveswitch.AudioStream(null, remoteMedia), 
      new window.fm.liveswitch.VideoStream(null, remoteMedia));
    Liveswitch.sfuDownstreamList[connectionId] = {mediaId, connection};

    connection.setIceServers([new window.fm.liveswitch.IceServer("stun.l.google.com:19302")]);
    connection.addOnStateChange(() => {
      dispatch(ActionCreator.SfuDownstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
    })
  
    return {type: ActionType.SfuDownstreamCreate, connectionId, mediaId, remoteClientId};
  },

  SfuDownstreamDestroy: function(connectionId) {
    delete Liveswitch.sfuDownstreamList[connectionId];
    
    return {type: ActionType.SfuDownstreamDestroy, connectionId};
  },

  ServerConnectRequest           : makeActionCreator(ActionType.ServerConnectRequest),
  ServerConnectResolve           : makeActionCreator(ActionType.ServerConnectResolve, "localClientId"),
  ServerConnectReject            : makeActionCreator(ActionType.ServerConnectReject),
  ChannelJoinRequest             : makeActionCreator(ActionType.ChannelJoinRequest, "channelId"),
  ChannelJoinReject              : makeActionCreator(ActionType.ChannelJoinReject),
  ChannelLeaveRequest            : makeActionCreator(ActionType.ChannelLeaveRequest),
  ChannelLeaveResolve            : makeActionCreator(ActionType.ChannelLeaveResolve),
  ChannelLeaveReject             : makeActionCreator(ActionType.ChannelLeaveReject),
  WebcamCaptureRequest           : makeActionCreator(ActionType.WebcamCaptureRequest),
  WebcamCaptureResolve           : makeActionCreator(ActionType.WebcamCaptureResolve, "mediaId"),
  WebcamCaptureReject            : makeActionCreator(ActionType.WebcamCaptureReject),
  LocalMediaReleaseRequest       : makeActionCreator(ActionType.LocalMediaReleaseRequest, "mediaId"),
  LocalMediaReleaseResolve       : makeActionCreator(ActionType.LocalMediaReleaseResolve, "mediaId"),
  LocalMediaReleaseReject        : makeActionCreator(ActionType.LocalMediaReleaseReject, "mediaId"),
  SfuLocalUpstreamStatusChange   : makeActionCreator(ActionType.SfuLocalUpstreamStatusChange, "connectionId", "status"),
  SfuLocalUpstreamOpenRequest    : makeActionCreator(ActionType.SfuLocalUpstreamOpenRequest, "connectionId"),
  SfuLocalUpstreamOpenResolve    : makeActionCreator(ActionType.SfuLocalUpstreamOpenResolve, "connectionId"),
  SfuLocalUpstreamOpenReject     : makeActionCreator(ActionType.SfuLocalUpstreamOpenReject, "connectionId"),
  SfuLocalUpstreamCloseRequest   : makeActionCreator(ActionType.SfuLocalUpstreamCloseRequest, "connectionId"),
  SfuLocalUpstreamCloseResolve   : makeActionCreator(ActionType.SfuLocalUpstreamCloseResolve, "connectionId"),
  SfuLocalUpstreamCloseReject    : makeActionCreator(ActionType.SfuLocalUpstreamCloseReject, "connectionId"),
  SfuDownstreamStatusChange      : makeActionCreator(ActionType.SfuDownstreamStatusChange, "connectionId", "status"),
  SfuDownstreamOpenRequest       : makeActionCreator(ActionType.SfuDownstreamOpenRequest, "connectionId"),
  SfuDownstreamOpenResolve       : makeActionCreator(ActionType.SfuDownstreamOpenResolve, "connectionId"),
  SfuDownstreamOpenReject        : makeActionCreator(ActionType.SfuDownstreamOpenReject, "connectionId"),
  SfuDownstreamCloseRequest      : makeActionCreator(ActionType.SfuDownstreamCloseRequest, "connectionId"),
  SfuDownstreamCloseResolve      : makeActionCreator(ActionType.SfuDownstreamCloseResolve, "connectionId"),
  SfuDownstreamCloseReject       : makeActionCreator(ActionType.SfuDownstreamCloseReject, "connectionId"),

}