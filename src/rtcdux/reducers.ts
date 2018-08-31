import { combineReducers } from "redux";
import { omit } from "lodash";

import { 
  ActionType, 
  getType,
  StateType
} from "typesafe-actions"

import * as rtc from "./actions"
type RtcAction = ActionType<typeof rtc>;

export type LocalMedia = {
  readonly mediaId: string;
  readonly name: string;
  readonly sfuConnectionId: string;
};

export type RemoteMedia = {
  readonly mediaId: string;
  readonly name: string;
  readonly remoteClientId: string;
  readonly sfuConnectionId: string; 
};

export type Sfu = {
  readonly connectionId: string;
  readonly status: string;
  readonly mediaId: string;
};

function localClientId(state: string = null, action: RtcAction) {
  switch(action.type) {
    case getType(rtc.ServerConnectResolve):              return action.payload.localClientId;
    default: return state;
  }
}

function channelStatus(state: string = 'LEFT', action: RtcAction) {
  switch(action.type) {
    case getType(rtc.ChannelJoinRequest):                return 'JOINING';
    case getType(rtc.ChannelJoinResolve):                return 'JOINED';
    case getType(rtc.ChannelJoinReject):                 return 'LEFT';
    case getType(rtc.ChannelLeaveRequest):               return 'LEAVING';
    case getType(rtc.ChannelLeaveResolve):               return 'LEFT';
    case getType(rtc.ChannelLeaveReject):                return 'JOINED';
    default: return state;
  }
}

function remoteClientList(state: ReadonlyMap<string, string> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.RemoteClientCreate):                  return {...state, [action.payload.remoteClientId]: action.payload.remoteClientId};
    case getType(rtc.RemoteClientDestroy):                 return omit(state, action.payload.remoteClientId);
    default: return state;
  }
}

function localMediaList(state: ReadonlyMap<string, LocalMedia> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.WebcamCaptureResolve):               return {...state, [action.payload.mediaId]: action.payload.mediaId};
    case getType(rtc.LocalMediaReleaseResolve):           return omit(state, action.payload.mediaId);
    default: return state;
  }
}

function remoteMediaList(state: ReadonlyMap<string, RemoteMedia> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.RemoteMediaCreate):                 return {...state, [action.payload.mediaId]: action.payload};
    case getType(rtc.RemoteMediaDestroy):                return omit(state, action.payload);
    case getType(rtc.RemoteMediaSfuUpdate):              return {...state, [action.payload.mediaId]: {...(state as any)[action.payload.mediaId], sfuConnectionId: action.payload.connectionId}};
    default: return state;
  }
}

function sfuLocalUpstreamList(state: ReadonlyMap<string, Sfu> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.SfuLocalUpstreamCreate):           return {...state, [action.payload.connectionId]: action.payload};
    case getType(rtc.SfuLocalUpstreamDestroy):          return omit(state, action.payload);
    case getType(rtc.SfuLocalUpstreamStatusChange):     return {...state, [action.payload.connectionId]: {...(state as any)[action.payload.connectionId], status: action.payload.status}};
    default: return state;
  }
}

function sfuRemoteUpstreamList(state: ReadonlyMap<string, string> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.SfuRemoteUpstreamCreate):          return {...state, [action.payload.connectionId]: action.payload.connectionId};
    case getType(rtc.SfuRemoteUpstreamDestroy):         return omit(state, action.payload.connectionId);
    default: return state;
  }
}

function sfuDownstreamList(state: ReadonlyMap<string, Sfu> = new Map(), action: RtcAction) {
  switch(action.type) {
    case getType(rtc.SfuDownstreamCreate):               return {...state, [action.payload.connectionId]: action.payload};
    case getType(rtc.SfuDownstreamDestroy):              return omit(state, action.payload);
    case getType(rtc.SfuDownstreamStatusChange):        return {...state, [action.payload.connectionId]: {...(state as any)[action.payload.connectionId], status: action.payload.status}};
    default: return state;
  }
}

export const rtcReducer = combineReducers({
  channelStatus,
  localClientId,
  remoteClientList,
  localMediaList,
  remoteMediaList,
  sfuLocalUpstreamList,
  sfuRemoteUpstreamList,
  sfuDownstreamList
});

export type State = StateType<typeof rtcReducer>

// function validAction(state, action) {
//   switch (action.type) {
//     case ActionType.ChannelJoinRequest:
//       return state.channelStatus == 'LEFT';
//     case ActionType.ChannelLeaveRequest:
//       return state.channelStatus == 'JOINED';
//     case ActionType.LocalMediaReleaseRequest:
//       return action.mediaId in state.localMediaList;
//     case ActionType.SfuLocalUpstreamOpenRequest:
//       return action.connectionId in state.sfuLocalUpstreamList && state.sfuLocalUpstreamList[action.connectionId].status == 'NEW';
//     case ActionType.SfuLocalUpstreamCloseRequest:
//       return action.connectionId in state.sfuLocalUpstreamList && state.sfuLocalUpstreamList[action.connectionId].status == 'OPEN';
//     case ActionType.SfuDownstreamOpenRequest:
//       return action.connectionId in state.sfuDownstreamList && sfuDownstreamList[action.connectionId].status == 'NEW';
//     case ActionType.SfuDownstreamCloseRequest:
//       return action.connectionId in state.sfuDownstreamList && sfuDownstreamList[action.connectionId].status == 'OPEN';

//     default: return true;
//   }
// }

// export function rtcReducer(state, action) {
//   if (state != undefined && !validAction(state, action)) {
//     console.log(["Rejected invalid redux action", action, state]);
//     return state;
//   } else {
//     return combinedReducers(state, action);
//   }
// }
