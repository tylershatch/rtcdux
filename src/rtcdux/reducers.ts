import { combineReducers, Action, Reducer } from "redux";
import { omit } from "lodash";

import { RtcActions } from "./action-types"

interface LocalMedia {
  mediaId: string;
  name: string;
  sfuConnectionId: string;
};

interface RemoteMedia {
  mediaId: string;
  mediaName: string;
  mediaOwner: string;
  remoteClientId: string;
  sfuConnectionId: string; 
};

interface Sfu {
  connectionId: string;
  status: string;
  mediaId: string;
};

interface RemoteClientList {[index:string] : string};
interface LocalMediaList {[index:string] : LocalMedia};
interface RemoteMediaList {[index:string] : RemoteMedia};
interface SfuLocalUpstreamList {[index:string] : Sfu};
interface SfuRemoteUpstreamList {[index:string] : string};
interface SfuDownstreamList {[index:string] : Sfu};

export interface RtcState {
  localClientId: string,
  channelStatus: string,
  remoteClientList: RemoteClientList,
  localMediaList: LocalMediaList,
  remoteMediaList: RemoteMediaList,
  sfuLocalUpstreamList: SfuLocalUpstreamList,
  sfuRemoteUpstreamList: SfuRemoteUpstreamList,
  sfuDownstreamList: SfuDownstreamList
}

const localClientId: Reducer<string> = (localClientId: string = null, action: RtcActions.Base) => {
  let thing: RtcActions.ServerConnectResolve = null;

  switch(action.type) {
    case "ServerConnectResolve":              return action.payload.localClientId;
    default: return localClientId;
  }
}

const channelStatus: Reducer<string> = (state: string = 'LEFT', action: RtcActions.Base) => {
  switch(action.type) {
    case "ChannelJoinRequest":                return 'JOINING';
    case "ChannelJoinResolve":                return 'JOINED';
    case "ChannelJoinReject":                 return 'LEFT';
    case "ChannelLeaveRequest":               return 'LEAVING';
    case "ChannelLeaveResolve":               return 'LEFT';
    case "ChannelLeaveReject":                return 'JOINED';
    default: return state;
  }
}

const remoteClientList: Reducer<RemoteClientList> = (remoteClientList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "RemoteClientCreate":                  return {...remoteClientList, [action.payload.remoteClientId]: action.payload.remoteClientId};
    case "RemoteClientDestroy":                 return omit(remoteClientList, action.payload.remoteClientId);
    default: return remoteClientList;
  }
}

const localMediaList: Reducer<LocalMediaList> = (localMediaList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "WebcamCaptureResolve":               return {...localMediaList, [action.payload.mediaId]: {...action.payload, sfuConnectionId: null}};
    case "LocalMediaReleaseResolve":           return omit(localMediaList, action.payload.mediaId);
    default: return localMediaList;
  }
}

const remoteMediaList: Reducer<RemoteMediaList> = (remoteMediaList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "RemoteMediaCreate":                 return {...remoteMediaList, [action.payload.mediaId]: {...action.payload, sfuConnectionId: null}};
    case "RemoteMediaDestroy":                return omit(remoteMediaList, action.payload.mediaId);
    case "RemoteMediaSfuUpdate":              return {...remoteMediaList, [action.payload.mediaId]: {...remoteMediaList[action.payload.mediaId], sfuConnectionId: action.payload.connectionId}};
    default: return remoteMediaList;
  }
}

const sfuLocalUpstreamList: Reducer<SfuLocalUpstreamList> = (sfuLocalUpstreamList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "SfuLocalUpstreamCreate":           return {...sfuLocalUpstreamList, [action.payload.connectionId]: {...action.payload, status: "NEW"}};
    case "SfuLocalUpstreamDestroy":          return omit(sfuLocalUpstreamList, action.payload.connectionId);
    case "SfuLocalUpstreamStatusChange":     return {...sfuLocalUpstreamList, [action.payload.connectionId]: {...sfuLocalUpstreamList[action.payload.connectionId], status: action.payload.status}};
    default: return sfuLocalUpstreamList;
  }
}

const sfuRemoteUpstreamList: Reducer<SfuRemoteUpstreamList> = (sfuRemoteUpstreamList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "SfuRemoteUpstreamCreate":          return {...sfuRemoteUpstreamList, [action.payload.connectionId]: action.payload.connectionId};
    case "SfuRemoteUpstreamDestroy":         return omit(sfuRemoteUpstreamList, action.payload.connectionId);
    default: return sfuRemoteUpstreamList;
  }
}

const sfuDownstreamList: Reducer<SfuDownstreamList> = (sfuDownstreamList = {}, action: RtcActions.Base) => {
  switch(action.type) {
    case "SfuDownstreamCreate":               return {...sfuDownstreamList, [action.payload.connectionId]: {...action.payload, status: "NEW"}};
    case "SfuDownstreamDestroy":              return omit(sfuDownstreamList, action.payload.connectionId);
    case "SfuDownstreamStatusChange":        return {...sfuDownstreamList, [action.payload.connectionId]: {...sfuDownstreamList[action.payload.connectionId], status: action.payload.status}};
    default: return sfuDownstreamList;
  }
}

export const rtcReducer: Reducer<RtcState> = combineReducers<RtcState>({
  localClientId,
  channelStatus,
  remoteClientList,
  localMediaList,
  remoteMediaList,
  sfuLocalUpstreamList,
  sfuRemoteUpstreamList,
  sfuDownstreamList
});
