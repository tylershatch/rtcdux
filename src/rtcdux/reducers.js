import { combineReducers } from "redux";
import { omit } from "lodash";

import { ActionType } from "./action-types"

function localClientId(state = null, action) {
  switch(action.type) {
    case ActionType.ServerConnectResolve:              return action.localClientId;
    default: return state;
  }
}

function channelStatus(state = 'LEFT', action) {
  switch(action.type) {
    case ActionType.ChannelJoinRequest:                return 'JOINING';
    case ActionType.ChannelJoinResolve:                return 'JOINED';
    case ActionType.ChannelJoinReject:                 return 'LEFT';
    case ActionType.ChannelLeaveRequest:               return 'LEAVING';
    case ActionType.ChannelLeaveResolve:               return 'LEFT';
    case ActionType.ChannelLeaveReject:                return 'JOINED';
    default: return state;
  }
}

function remoteClientList(state = {}, action) {
  switch(action.type) {
    case ActionType.RemoteClientCreate:                  return {...state, [action.remoteClientId]: action.remoteClientId};
    case ActionType.RemoteClientDestroy:                 return omit(state, action.remoteClientId);
    default: return state;
  }
}

function localMediaList(state = {}, action) {
  switch(action.type) {
    case ActionType.WebcamCaptureResolve:               return {...state, [action.mediaId]: {name: "webcam", sfuConnectionId: null}};
    case ActionType.LocalMediaReleaseResolve:           return omit(state, action.mediaId);
    default: return state;
  }
}

function remoteMediaList(state = {}, action) {
  switch(action.type) {
    case ActionType.RemoteMediaCreate:                 return {...state, [action.mediaId]: {name: action.name, remoteClientId: action.remoteClientId, sfuConnectionId: null}};
    case ActionType.RemoteMediaDestroy:                return omit(state, action.mediaId);
    case ActionType.RemoteMediaSfuUpdate:              return {...state, [action.mediaId]: {...state[action.mediaId], sfuConnectionId: action.connectionId}};
    default: return state;
  }
}

function sfuLocalUpstreamList(state = {}, action) {
  switch(action.type) {
    case ActionType.SfuLocalUpstreamCreate:           return {...state, [action.connectionId]: {status: "NEW", mediaId: action.mediaId}};
    case ActionType.SfuLocalUpstreamDestroy:          return omit(state, action.connectionId);
    case ActionType.SfuLocalUpstreamStatusChange:     return {...state, [action.connectionId]: {...state[action.connectionId], status: action.status}};
    default: return state;
  }
}

function sfuRemoteUpstreamList(state = {}, action) {
  switch(action.type) {
    case ActionType.SfuRemoteUpstreamCreate:          return {...state, [action.connectionId]: action.connectionId};
    case ActionType.SfuRemoteUpstreamDestroy:         return omit(state, action.connectionId);
    default: return state;
  }
}

function sfuDownstreamList(state = {}, action) {
  switch(action.type) {
    case ActionType.SfuDownstreamCreate:               return {...state, [action.connectionId]: {status: "NEW", clientId: action.clientId, mediaId: action.mediaId}};
    case ActionType.SfuDownstreamDestroy:              return omit(state, action.connectionId);
    case ActionType.SfuDownstreamStatusChange:        return {...state, [action.connectionId]: {...state[action.connectionId], status: action.status}};
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
