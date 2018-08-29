import { 
  createAction,
  createStandardAction 
} from "typesafe-actions";

import {
  LocalMedia,
  RemoteMedia,
  Sfu
} from "./types";

import { Liveswitch, LiveswitchApi } from './liveswitch';

const CONNECTION_STATES = {
  [LiveswitchApi.ConnectionState.New]:           'NEW',
  [LiveswitchApi.ConnectionState.Initializing]:  'INITIALIZING',
  [LiveswitchApi.ConnectionState.Connecting]:    'CONNECTING',
  [LiveswitchApi.ConnectionState.Connected]:     'CONNECTED',
  [LiveswitchApi.ConnectionState.Closing]:       'CLOSING',
  [LiveswitchApi.ConnectionState.Closed]:        'CLOSED',
  [LiveswitchApi.ConnectionState.Failing]:       'FAILING',
  [LiveswitchApi.ConnectionState.Failed]:        'FAILED',
}

export const ChannelJoinResolve = createAction('ChannelJoinResolve', (resolve) => { return (dispatch: any, channel: any) => {
  Liveswitch.channel = channel;

  // Handle actions dispatched from a remote client
  channel.addOnClientMessage((remoteClientInfo, message) => {
    // let remoteAction = JSON.parse(message);
    // let actionCreator = ActionCreator[remoteAction.actionCreator];
    // let actionCreatorArgs = remoteAction.actionCreatorArgs;
    // dispatch(actionCreator(...actionCreatorArgs));
  });

  // Create all existing remote clients
  let remoteClientInfos = channel.getRemoteClientInfos()
  for (let i in remoteClientInfos) {
    dispatch(RemoteClientCreate(remoteClientInfos[i]));
  }

  // If a new remote client joins, create that client
  channel.addOnRemoteClientJoin((remoteClientInfo) => {
    dispatch(RemoteClientCreate(remoteClientInfo));
  });

  // If a remote client leaves, destroy that client
  channel.addOnRemoteClientLeave((remoteClientInfo) => {
    dispatch(RemoteClientDestroy(remoteClientInfo.getId()));
  });

  // Create all existing remote upstream connections
  let remoteUpstreamConnectionInfos = channel.getRemoteUpstreamConnectionInfos()
  for (let i in remoteUpstreamConnectionInfos) {
    if (remoteUpstreamConnectionInfos[i].getType() === "sfu") {
      dispatch(SfuRemoteUpstreamCreate(remoteUpstreamConnectionInfos[i]));
    }
  }

  // If a new remote upstream connection is opened, create that connection
  channel.addOnRemoteUpstreamConnectionOpen((remoteUpstreamConnectionInfo) => {
    if (remoteUpstreamConnectionInfo.getType() === "sfu") {
      dispatch(SfuRemoteUpstreamCreate(remoteUpstreamConnectionInfo));
    }
  });

  return resolve();
}});

export const RemoteClientCreate = createAction('RemoteClientCreate', (resolve) => { return (remoteClientInfo: any) => {
  let remoteClientId = remoteClientInfo.getId() as string;
  Liveswitch.remoteClientList[remoteClientId] = remoteClientInfo;
  return resolve(remoteClientId);
}});

export const RemoteClientDestroy = createAction('RemoteClientDestroy', (resolve) => { return (remoteClientId: string) => {
  delete Liveswitch.remoteClientList[remoteClientId];

  return resolve(remoteClientId);
}});

export const RemoteMediaCreate = createAction('RemoteMediaCreate', (resolve) => { return (mediaId: string, name: string, remoteClientId: string, sfuConnectionId: string) => {
  let remoteMedia = new LiveswitchApi.RemoteMedia();
  Liveswitch.remoteMediaList[mediaId] = remoteMedia;

  return resolve({mediaId, name, remoteClientId, sfuConnectionId} as RemoteMedia);
}});

export const RemoteMediaDestroy = createAction('RemoteMediaDestroy', (resolve) => { return (mediaId: string) => {
  delete Liveswitch.remoteMediaList[mediaId];

  return resolve(mediaId);
}});

export const SfuLocalUpstreamCreate = createAction('SfuLocalUpstreamCreate', (resolve) => { return (dispatch: any, mediaId: string) => {
  let localMedia = Liveswitch.localMediaList[mediaId];
  let localAudioStream = new LiveswitchApi.AudioStream(localMedia, null);
  let localvideoStream = new LiveswitchApi.VideoStream(localMedia, null); 
  let connection = Liveswitch.channel.createSfuUpstreamConnection(localAudioStream, localvideoStream);

  let connectionId = connection.getId();
  Liveswitch.sfuLocalUpstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new LiveswitchApi.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuLocalUpstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  });

  return resolve({status:"NEW", connectionId, mediaId} as Sfu);
}});

export const SfuLocalUpstreamDestroy = createAction('SfuLocalUpstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuLocalUpstreamList[connectionId];

  return resolve(connectionId);
}});

export const SfuRemoteUpstreamCreate = createAction('SfuRemoteUpstreamCreate', (resolve) => { return (remoteConnectionInfo: any) => {
  let connectionId = remoteConnectionInfo.getId() as string;
  Liveswitch.sfuRemoteUpstreamList[connectionId] = remoteConnectionInfo;

  return resolve(connectionId);
}});

export const SfuRemoteUpstreamDestroy = createAction('SfuRemoteUpstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuRemoteUpstreamList[connectionId];

  return resolve(connectionId);
}});

export const SfuDownstreamCreate = createAction('SfuDownstreamCreate', (resolve) => { return (dispatch: any, connectionId: string, mediaId: string) => {
  let remoteMedia = Liveswitch.remoteMediaList[mediaId];
  let connection = Liveswitch.channel.createSfuDownstreamConnection(
    Liveswitch.sfuRemoteUpstreamList[connectionId],
    new LiveswitchApi.AudioStream(null, remoteMedia), 
    new LiveswitchApi.VideoStream(null, remoteMedia));
  Liveswitch.sfuDownstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new LiveswitchApi.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuDownstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  })

  return resolve({status:"NEW", connectionId, mediaId} as Sfu);
}});

export const SfuDownstreamDestroy = createAction('SfuDownstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuDownstreamList[connectionId];
  
  return resolve(connectionId);
}});

export const ServerConnectRequest           = createStandardAction("ServerConnectRequest")<void>();
export const ServerConnectResolve           = createStandardAction("ServerConnectResolve")<string /*localClientId*/>();
export const ServerConnectReject            = createStandardAction("ServerConnectReject")<void>();
export const ChannelJoinRequest             = createStandardAction("ChannelJoinRequest")<string /*channelId*/>();
export const ChannelJoinReject              = createStandardAction("ChannelJoinReject")<void>();
export const ChannelLeaveRequest            = createStandardAction("ChannelLeaveRequest")<void>();
export const ChannelLeaveResolve            = createStandardAction("ChannelLeaveResolve")<void>();
export const ChannelLeaveReject             = createStandardAction("ChannelLeaveReject")<void>();
export const WebcamCaptureRequest           = createStandardAction("WebcamCaptureRequest")<void>();

export const WebcamCaptureResolve = createAction('WebcamCaptureResolve', (resolve) => { return (mediaId: string, name: string) => {
  return resolve({mediaId, name});
}});

export const WebcamCaptureReject            = createStandardAction("WebcamCaptureReject")<void>();
export const LocalMediaReleaseRequest       = createStandardAction("LocalMediaReleaseRequest")<string /*mediaId*/>();
export const LocalMediaReleaseResolve       = createStandardAction("LocalMediaReleaseResolve")<string /*mediaId*/>();
export const LocalMediaReleaseReject        = createStandardAction("LocalMediaReleaseReject")<string /*mediaId*/>();

export const RemoteMediaSfuUpdate = createAction('RemoteMediaSfuUpdate', (resolve) => { return (mediaId: string, connectionId: string) => {
  return resolve({mediaId, connectionId});
}});

export const SfuLocalUpstreamStatusChange = createAction('SfuLocalUpstreamStatusChange', (resolve) => { return (connectionId: string, status: string) => {
  return resolve({connectionId, status});
}});

export const SfuLocalUpstreamOpenRequest    = createStandardAction("SfuLocalUpstreamOpenRequest")<string /*connectionId*/>();
export const SfuLocalUpstreamOpenResolve    = createStandardAction("SfuLocalUpstreamOpenResolve")<string /*connectionId*/>();
export const SfuLocalUpstreamOpenReject     = createStandardAction("SfuLocalUpstreamOpenReject")<string /*connectionId*/>();
export const SfuLocalUpstreamCloseRequest   = createStandardAction("SfuLocalUpstreamCloseRequest")<string /*connectionId*/>();
export const SfuLocalUpstreamCloseResolve   = createStandardAction("SfuLocalUpstreamCloseResolve")<string /*connectionId*/>();
export const SfuLocalUpstreamCloseReject    = createStandardAction("SfuLocalUpstreamCloseReject")<string /*connectionId*/>();

export const SfuDownstreamStatusChange = createAction('SfuDownstreamStatusChange', (resolve) => { return (connectionId: string, status: string) => {
  return resolve({connectionId, status});
}});

export const SfuDownstreamOpenRequest       = createStandardAction("SfuDownstreamOpenRequest")<string /*connectionId*/>();
export const SfuDownstreamOpenResolve       = createStandardAction("SfuDownstreamOpenResolve")<string /*connectionId*/>();
export const SfuDownstreamOpenReject        = createStandardAction("SfuDownstreamOpenReject")<string /*connectionId*/>();
export const SfuDownstreamCloseRequest      = createStandardAction("SfuDownstreamCloseRequest")<string /*connectionId*/>();
export const SfuDownstreamCloseResolve      = createStandardAction("SfuDownstreamCloseResolve")<string /*connectionId*/>();
export const SfuDownstreamCloseReject       = createStandardAction("SfuDownstreamCloseReject")<string /*connectionId*/>();