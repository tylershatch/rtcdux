import { fm } from './frozen-mountain';

import { Dispatch } from 'redux';

import { 
  createAction,
  createStandardAction 
} from "typesafe-actions";

import {
  RemoteMedia,
  Sfu
} from "./reducers";

import * as rtc from './actions';

export const Liveswitch = {
  localClient: null as fm.liveswitch.Client,
  channel: null as fm.liveswitch.Channel,
  remoteClientList: {} as {[index:string] : fm.liveswitch.ClientInfo},
  localMediaList: {} as {[index:string] : fm.liveswitch.LocalMedia},
  remoteMediaList: {} as {[index:string] : fm.liveswitch.RemoteMedia},
  sfuRemoteUpstreamList: {} as {[index:string] : fm.liveswitch.ConnectionInfo},
  
  sfuLocalUpstreamList: {} as {
    [index:string] : {
      connection: fm.liveswitch.SfuUpstreamConnection; 
      mediaId: string;
    }
  },

  sfuDownstreamList: {} as {
    [index:string] : {
      connection: fm.liveswitch.SfuDownstreamConnection; 
      mediaId: string;
    }
  },
  
  // _getInternal is not an exposed typescript method of fm.liveswitch, so we must strip the type with 'as any'
  getLocalVideoStream: (mediaId: string) => (Liveswitch.localMediaList[mediaId] as any)._getInternal()._videoMediaStream,
  getRemoteVideoStream: (mediaId: string) => (Liveswitch.remoteMediaList[mediaId] as any)._getInternal()._videoMediaStream,
}

const CONNECTION_STATES = {
  [fm.liveswitch.ConnectionState.New]:           'NEW',
  [fm.liveswitch.ConnectionState.Initializing]:  'INITIALIZING',
  [fm.liveswitch.ConnectionState.Connecting]:    'CONNECTING',
  [fm.liveswitch.ConnectionState.Connected]:     'CONNECTED',
  [fm.liveswitch.ConnectionState.Closing]:       'CLOSING',
  [fm.liveswitch.ConnectionState.Closed]:        'CLOSED',
  [fm.liveswitch.ConnectionState.Failing]:       'FAILING',
  [fm.liveswitch.ConnectionState.Failed]:        'FAILED',
}

export const ChannelJoinResolve = createAction('ChannelJoinResolve', (resolve: any) => { return (dispatch: Dispatch, channel: fm.liveswitch.Channel) => {
  Liveswitch.channel = channel;

  // Handle actions dispatched from a remote client
  channel.addOnClientMessage((remoteClientInfo: fm.liveswitch.ClientInfo, message: string) => {
    let remoteAction = JSON.parse(message);
    let actionCreator = (rtc as any)[remoteAction.actionCreator];
    let actionCreatorArgs = remoteAction.actionCreatorArgs;
    dispatch(actionCreator(...actionCreatorArgs));
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
  return resolve({remoteClientId});
}});

export const RemoteClientDestroy = createAction('RemoteClientDestroy', (resolve) => { return (remoteClientId: string) => {
  delete Liveswitch.remoteClientList[remoteClientId];

  return resolve({remoteClientId});
}});

export const RemoteMediaCreate = createAction('RemoteMediaCreate', (resolve) => { return (mediaId: string, name: string, remoteClientId: string, sfuConnectionId: string) => {
  let remoteMedia = new fm.liveswitch.RemoteMedia();
  Liveswitch.remoteMediaList[mediaId] = remoteMedia;

  return resolve({mediaId, name, remoteClientId, sfuConnectionId} as RemoteMedia);
}});

export const RemoteMediaDestroy = createAction('RemoteMediaDestroy', (resolve) => { return (mediaId: string) => {
  delete Liveswitch.remoteMediaList[mediaId];

  return resolve({mediaId});
}});

export const SfuLocalUpstreamCreate = createAction('SfuLocalUpstreamCreate', (resolve) => { return (dispatch: Dispatch, mediaId: string) => {
  let localMedia = Liveswitch.localMediaList[mediaId];
  let localAudioStream = new fm.liveswitch.AudioStream(localMedia, null);
  let localvideoStream = new fm.liveswitch.VideoStream(localMedia, null); 
  let connection = Liveswitch.channel.createSfuUpstreamConnection(localAudioStream, localvideoStream);

  let connectionId = connection.getId() as string;
  Liveswitch.sfuLocalUpstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuLocalUpstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  });

  return resolve({status:"NEW", connectionId, mediaId} as Sfu);
}});

export const SfuLocalUpstreamDestroy = createAction('SfuLocalUpstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuLocalUpstreamList[connectionId];

  return resolve({connectionId});
}});

export const SfuRemoteUpstreamCreate = createAction('SfuRemoteUpstreamCreate', (resolve) => { return (remoteConnectionInfo: any) => {
  let connectionId = remoteConnectionInfo.getId() as string;
  Liveswitch.sfuRemoteUpstreamList[connectionId] = remoteConnectionInfo;

  return resolve({connectionId});
}});

export const SfuRemoteUpstreamDestroy = createAction('SfuRemoteUpstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuRemoteUpstreamList[connectionId];

  return resolve({connectionId});
}});

export const SfuDownstreamCreate = createAction('SfuDownstreamCreate', (resolve) => { return (dispatch: Dispatch, connectionId: string, mediaId: string) => {
  let remoteMedia = Liveswitch.remoteMediaList[mediaId];
  let connection = Liveswitch.channel.createSfuDownstreamConnection(
    Liveswitch.sfuRemoteUpstreamList[connectionId],
    new fm.liveswitch.AudioStream(null, remoteMedia), 
    new fm.liveswitch.VideoStream(null, remoteMedia));
  Liveswitch.sfuDownstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuDownstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  })

  return resolve({status:"NEW", connectionId, mediaId} as Sfu);
}});

export const SfuDownstreamDestroy = createAction('SfuDownstreamDestroy', (resolve) => { return (connectionId: string) => {
  delete Liveswitch.sfuDownstreamList[connectionId];
  
  return resolve({connectionId});
}});

export const ServerConnectRequest           = createStandardAction("ServerConnectRequest")<void>();
export const ServerConnectResolve           = createStandardAction("ServerConnectResolve")<{localClientId: string}>();
export const ServerConnectReject            = createStandardAction("ServerConnectReject")<void>();
export const ChannelJoinRequest             = createStandardAction("ChannelJoinRequest")<{channelId: string}>();
export const ChannelJoinReject              = createStandardAction("ChannelJoinReject")<void>();
export const ChannelLeaveRequest            = createStandardAction("ChannelLeaveRequest")<void>();
export const ChannelLeaveResolve            = createStandardAction("ChannelLeaveResolve")<void>();
export const ChannelLeaveReject             = createStandardAction("ChannelLeaveReject")<void>();
export const WebcamCaptureRequest           = createStandardAction("WebcamCaptureRequest")<void>();

export const WebcamCaptureResolve = createAction('WebcamCaptureResolve', (resolve) => { return (mediaId: string, name: string) => {
  return resolve({mediaId, name});
}});

export const WebcamCaptureReject            = createStandardAction("WebcamCaptureReject")<void>();
export const LocalMediaReleaseRequest       = createStandardAction("LocalMediaReleaseRequest")<{mediaId: string}>();
export const LocalMediaReleaseResolve       = createStandardAction("LocalMediaReleaseResolve")<{mediaId: string}>();
export const LocalMediaReleaseReject        = createStandardAction("LocalMediaReleaseReject")<{mediaId: string}>();

export const RemoteMediaSfuUpdate = createAction('RemoteMediaSfuUpdate', (resolve) => { return (mediaId: string, connectionId: string) => {
  return resolve({mediaId, connectionId});
}});

export const SfuLocalUpstreamStatusChange = createAction('SfuLocalUpstreamStatusChange', (resolve) => { return (connectionId: string, status: string) => {
  return resolve({connectionId, status});
}});

export const SfuLocalUpstreamOpenRequest    = createStandardAction("SfuLocalUpstreamOpenRequest")<{connectionId: string}>();
export const SfuLocalUpstreamOpenResolve    = createStandardAction("SfuLocalUpstreamOpenResolve")<{connectionId: string}>();
export const SfuLocalUpstreamOpenReject     = createStandardAction("SfuLocalUpstreamOpenReject")<{connectionId: string}>();
export const SfuLocalUpstreamCloseRequest   = createStandardAction("SfuLocalUpstreamCloseRequest")<{connectionId: string}>();
export const SfuLocalUpstreamCloseResolve   = createStandardAction("SfuLocalUpstreamCloseResolve")<{connectionId: string}>();
export const SfuLocalUpstreamCloseReject    = createStandardAction("SfuLocalUpstreamCloseReject")<{connectionId: string}>();

export const SfuDownstreamStatusChange = createAction('SfuDownstreamStatusChange', (resolve) => { return (connectionId: string, status: string) => {
  return resolve({connectionId, status});
}});

export const SfuDownstreamOpenRequest       = createStandardAction("SfuDownstreamOpenRequest")<{connectionId: string}>();
export const SfuDownstreamOpenResolve       = createStandardAction("SfuDownstreamOpenResolve")<{connectionId: string}>();
export const SfuDownstreamOpenReject        = createStandardAction("SfuDownstreamOpenReject")<{connectionId: string}>();
export const SfuDownstreamCloseRequest      = createStandardAction("SfuDownstreamCloseRequest")<{connectionId: string}>();
export const SfuDownstreamCloseResolve      = createStandardAction("SfuDownstreamCloseResolve")<{connectionId: string}>();
export const SfuDownstreamCloseReject       = createStandardAction("SfuDownstreamCloseReject")<{connectionId: string}>();