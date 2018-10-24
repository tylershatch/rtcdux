/// <reference path="./fm.liveswitch.d.ts" />
require("./fm.liveswitch.js");

import { Dispatch, ActionCreator } from 'redux';

import * as RtcActionCreators from './action-creators';
import * as rtc from "./rtc";
import { RtcActions } from './action-types';

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

export const ServerConnectRequest: ActionCreator<RtcActions.ServerConnectRequest> = () => {
  return { type: "ServerConnectRequest", payload: {}  }
}

export const ServerConnectResolve: ActionCreator<RtcActions.ServerConnectResolve> = (localClientId: string) => {
  return { type: "ServerConnectResolve", payload: {localClientId}  }
}

export const ServerConnectReject: ActionCreator<RtcActions.ServerConnectReject> = () => {
  return { type: "ServerConnectReject", payload: {} }
}

export const ChannelJoinRequest: ActionCreator<RtcActions.ChannelJoinRequest> = (channelId: string) => {  
  return { type: "ChannelJoinRequest", payload: {channelId} };
};

export const ChannelJoinResolve: ActionCreator<RtcActions.ChannelJoinResolve> = (dispatch: Dispatch, channel: fm.liveswitch.Channel) => {
  rtc.internal.channel = channel;

  // Handle actions dispatched from a remote client
  channel.addOnClientMessage((remoteClientInfo: fm.liveswitch.ClientInfo, message: string) => {
    let remoteAction = JSON.parse(message);
    let actionCreator = (RtcActionCreators as any)[remoteAction.actionCreator];
    let actionCreatorArgs = remoteAction.actionCreatorArgs;
    dispatch(actionCreator(...actionCreatorArgs));
  });

  // Create all existing remote clients
  let remoteClientInfos = channel.getRemoteClientInfos()
  for (let i in remoteClientInfos) {
    dispatch(RemoteClientCreate(remoteClientInfos[i]));
  }

  // If a new remote client joins, create that client
  // HACK: any type, dafuq
  channel.addOnRemoteClientJoin((remoteClientInfo: any) => {
    dispatch(RemoteClientCreate(remoteClientInfo));
  });

  // If a remote client leaves, destroy that client
  // HACK: any type, dafuq
  channel.addOnRemoteClientLeave((remoteClientInfo: any) => {
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

  return { type: 'ChannelJoinResolve', payload: {} }
};

export const ChannelJoinReject: ActionCreator<RtcActions.ChannelJoinReject> = () => {
  return { type: "ChannelJoinReject", payload: {} }
}

export const ChannelLeaveRequest: ActionCreator<RtcActions.ChannelLeaveRequest> = () => {
  return { type: "ChannelLeaveRequest", payload: {} }
}

export const ChannelLeaveResolve: ActionCreator<RtcActions.ChannelLeaveResolve> = () => {
  return { type: "ChannelLeaveResolve", payload: {} }
}

export const ChannelLeaveReject: ActionCreator<RtcActions.ChannelLeaveReject> = () => {
  return { type: "ChannelLeaveReject", payload: {} }
}

export const RemoteClientCreate: ActionCreator<RtcActions.RemoteClientCreate> = (remoteClientInfo: fm.liveswitch.ClientInfo) => {
  let remoteClientId = remoteClientInfo.getId() as string;
  rtc.internal.remoteClientList[remoteClientId] = remoteClientInfo;

  return { type: "RemoteClientCreate", payload: {remoteClientId} };
};

export const RemoteClientDestroy: ActionCreator<RtcActions.RemoteClientDestroy> = (remoteClientId: string) => {
  delete rtc.internal.remoteClientList[remoteClientId];

  return { type: "RemoteClientDestroy", payload: {remoteClientId} };
};

export const WebcamCaptureRequest: ActionCreator<RtcActions.WebcamCaptureRequest> = () => {
  return { type: "WebcamCaptureRequest", payload: {} }
}

export const WebcamCaptureResolve: ActionCreator<RtcActions.WebcamCaptureResolve> = (mediaId: string, name: string) => { 
  return { type: "WebcamCaptureResolve", payload: {mediaId, name} };
};

export const WebcamCaptureReject: ActionCreator<RtcActions.WebcamCaptureReject> = () => {
  return { type: "WebcamCaptureReject", payload: {} }
}

export const LocalMediaReleaseRequest: ActionCreator<RtcActions.LocalMediaReleaseRequest> = (mediaId: string) => { 
  return { type: "LocalMediaReleaseRequest", payload: {mediaId} };
};

export const LocalMediaReleaseResolve: ActionCreator<RtcActions.LocalMediaReleaseResolve> = (mediaId: string) => {  
  return { type: "LocalMediaReleaseResolve", payload: {mediaId} };
};

export const LocalMediaReleaseReject: ActionCreator<RtcActions.LocalMediaReleaseReject> = (mediaId: string) => { 
  return { type: "LocalMediaReleaseReject", payload: {mediaId} };
};

export const RemoteMediaSfuUpdate: ActionCreator<RtcActions.RemoteMediaSfuUpdate> = (mediaId: string, connectionId: string) => { 
  return { type: "RemoteMediaSfuUpdate", payload: {mediaId, connectionId} };
};

export const RemoteMediaCreate: ActionCreator<RtcActions.RemoteMediaCreate> = (mediaId: string, mediaName: string, mediaOwner: string, remoteClientId: string) => {
  let remoteMedia = new fm.liveswitch.RemoteMedia();
  rtc.internal.remoteMediaList[mediaId] = remoteMedia;

  return { type: "RemoteMediaCreate", payload: {mediaId, mediaName, mediaOwner, remoteClientId} };
};

export const RemoteMediaDestroy: ActionCreator<RtcActions.RemoteMediaDestroy> = (mediaId: string) => {
  delete rtc.internal.remoteMediaList[mediaId];

  return { type: "RemoteMediaDestroy", payload: {mediaId} };
};

export const SfuLocalUpstreamCreate: ActionCreator<RtcActions.SfuLocalUpstreamCreate> = (dispatch: Dispatch, mediaId: string) => {
  let localMedia = rtc.internal.localMediaList[mediaId];
  let localAudioStream = new fm.liveswitch.AudioStream(localMedia, null);
  let localvideoStream = new fm.liveswitch.VideoStream(localMedia, null); 
  let connection = rtc.internal.channel.createSfuUpstreamConnection(localAudioStream, localvideoStream);

  let connectionId = connection.getId() as string;
  rtc.internal.sfuLocalUpstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuLocalUpstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  });

  return { type: "SfuLocalUpstreamCreate", payload: {connectionId, mediaId} };
};

export const SfuLocalUpstreamDestroy: ActionCreator<RtcActions.SfuLocalUpstreamDestroy> = (connectionId: string) => {
  delete rtc.internal.sfuLocalUpstreamList[connectionId];

  return { type: "SfuLocalUpstreamDestroy", payload: {connectionId} };
};

export const SfuLocalUpstreamStatusChange: ActionCreator<RtcActions.SfuLocalUpstreamStatusChange> = (connectionId: string, status: string) => {  
  return { type: "SfuLocalUpstreamStatusChange", payload: {connectionId, status} };
};

export const SfuLocalUpstreamOpenRequest: ActionCreator<RtcActions.SfuLocalUpstreamOpenRequest> = (connectionId: string) => {  
  return { type: "SfuLocalUpstreamOpenRequest", payload: {connectionId} };
};

export const SfuLocalUpstreamOpenResolve: ActionCreator<RtcActions.SfuLocalUpstreamOpenResolve> = (connectionId: string) => {  
  return { type: "SfuLocalUpstreamOpenResolve", payload: {connectionId} };
};

export const SfuLocalUpstreamOpenReject: ActionCreator<RtcActions.SfuLocalUpstreamOpenReject> = (connectionId: string) => {  
  return { type: "SfuLocalUpstreamOpenReject", payload: {connectionId} };
};

export const SfuLocalUpstreamCloseRequest: ActionCreator<RtcActions.SfuLocalUpstreamCloseRequest> = (connectionId: string) => {  
  return { type: "SfuLocalUpstreamCloseRequest", payload: {connectionId} };
};

export const SfuLocalUpstreamCloseResolve: ActionCreator<RtcActions.SfuLocalUpstreamCloseResolve> = (connectionId: string) => {  
  return { type: "SfuLocalUpstreamCloseResolve", payload: {connectionId} };
};

export const SfuLocalUpstreamCloseReject: ActionCreator<RtcActions.SfuLocalUpstreamCloseReject> = (connectionId: string) => { 
  return { type: "SfuLocalUpstreamCloseReject", payload: {connectionId} };
};

export const SfuRemoteUpstreamCreate: ActionCreator<RtcActions.SfuRemoteUpstreamCreate> = (remoteConnectionInfo: fm.liveswitch.ConnectionInfo) => {
  let connectionId = remoteConnectionInfo.getId() as string;
  rtc.internal.sfuRemoteUpstreamList[connectionId] = remoteConnectionInfo;

  return { type: "SfuRemoteUpstreamCreate", payload: {connectionId} };
};

export const SfuRemoteUpstreamDestroy: ActionCreator<RtcActions.SfuRemoteUpstreamDestroy> = (connectionId: string) => {
  delete rtc.internal.sfuRemoteUpstreamList[connectionId];

  return { type: "SfuRemoteUpstreamDestroy", payload: {connectionId} };
};

export const SfuDownstreamCreate: ActionCreator<RtcActions.SfuDownstreamCreate> = (dispatch: Dispatch, connectionId: string, mediaId: string) => {
  let remoteMedia = rtc.internal.remoteMediaList[mediaId];
  let connection = rtc.internal.channel.createSfuDownstreamConnection(
    rtc.internal.sfuRemoteUpstreamList[connectionId],
    new fm.liveswitch.AudioStream(null, remoteMedia), 
    new fm.liveswitch.VideoStream(null, remoteMedia));
  rtc.internal.sfuDownstreamList[connectionId] = {mediaId, connection};

  connection.setIceServers([new fm.liveswitch.IceServer("stun.l.google.com:19302")]);
  connection.addOnStateChange(() => {
    dispatch(SfuDownstreamStatusChange(connectionId, CONNECTION_STATES[connection.getState()]));
  })

  return { type: "SfuDownstreamCreate", payload: {connectionId, mediaId} };
};

export const SfuDownstreamDestroy: ActionCreator<RtcActions.SfuDownstreamDestroy> = (connectionId: string) => {
  delete rtc.internal.sfuDownstreamList[connectionId];
  
  return { type: "SfuDownstreamDestroy", payload: {connectionId} };
};

export const SfuDownstreamStatusChange: ActionCreator<RtcActions.SfuDownstreamStatusChange> = (connectionId: string, status: string) => {  
  return { type: "SfuDownstreamStatusChange", payload: {connectionId, status} };
};

export const SfuDownstreamOpenRequest: ActionCreator<RtcActions.SfuDownstreamOpenRequest> = (connectionId: string) => {  
  return { type: "SfuDownstreamOpenRequest", payload: {connectionId} };
};

export const SfuDownstreamOpenResolve: ActionCreator<RtcActions.SfuDownstreamOpenResolve> = (connectionId: string) => {  
  return { type: "SfuDownstreamOpenResolve", payload: {connectionId} };
};

export const SfuDownstreamOpenReject: ActionCreator<RtcActions.SfuDownstreamOpenReject> = (connectionId: string) => {  
  return { type: "SfuDownstreamOpenReject", payload: {connectionId} };
};

export const SfuDownstreamCloseRequest: ActionCreator<RtcActions.SfuDownstreamCloseRequest> = (connectionId: string) => {  
  return { type: "SfuDownstreamCloseRequest", payload: {connectionId} };
};

export const SfuDownstreamCloseResolve: ActionCreator<RtcActions.SfuDownstreamCloseResolve> = (connectionId: string) => { 
  return { type: "SfuDownstreamCloseResolve", payload: {connectionId} };
};

export const SfuDownstreamCloseReject: ActionCreator<RtcActions.SfuDownstreamCloseReject> = (connectionId: string) => { 
  return { type: "SfuDownstreamCloseReject", payload: {connectionId} };
};