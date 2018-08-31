import { put, call, select, take, takeEvery } from 'redux-saga/effects';

import {  
  getType,
  ActionType
} from "typesafe-actions";

import * as rtc from './actions';
import { Effect } from './effects';
import { State } from './reducers';
import { Dispatch } from 'redux';

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func: any) {
  let fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

function selectSfuForLocalMedia(state: State, mediaId: string) {
  for (let connectionId in state.sfuLocalUpstreamList) {
    if ((state.sfuLocalUpstreamList as any)[connectionId].mediaId === mediaId) {
      return connectionId;
    }
  }

  return null;
}

function selectRemoteMediaForSfu(state: State, connectionId: string) {
  for (let mediaId in state.remoteMediaList) {
    if ((state.remoteMediaList as any)[mediaId].sfuConnectionId === connectionId) {
      return mediaId;
    }
  }

  return null;
}

function selectRemoteClientForRemoteMedia(state: State, mediaId: string) {
  return (state.remoteMediaList as any)[mediaId].remoteClientId;
}

export function* rtcSaga(dispatch: Dispatch) {

  // Bind reject/resolve callbacks
  yield takeEvery('*', function*(action: any){
    if (action.type.endsWith('Request')) {
      let effectName = action.type.slice(0, -'Request'.length);

      let effect = (Effect as any)[effectName];
      let effectParams = getParamNames(effect).map((name: string) => ((name === "dispatch") ? dispatch : (action as any).payload[name]));

      let resolveActionCreator = (rtc as any)[effectName + "Resolve"];
      let rejectActionCreator = (rtc as any)[effectName + "Reject"];
      
      try {
        // HACK typescript does not support variadic arguments i guess, so must
        // coerce 'call' to type 'any'
        let result = yield (call as any)(effect, ...effectParams);

        let params = getParamNames(resolveActionCreator);
        let passDispatch = Object.values(params)[0] === "dispatch";
        if (passDispatch) {
          yield put(resolveActionCreator(dispatch, result));
        } else {
          yield put(resolveActionCreator(result));
        }
      } catch (error) {
        console.log({action, error});
        console.log(error.stack);
        yield put(rejectActionCreator(error));
      }
    }
  });

  yield takeEvery(getType(rtc.ChannelJoinResolve), function*(action: ActionType<typeof rtc.ChannelJoinResolve>) {
    // For each local media object
    let localMediaList = yield select((state: State) => state.localMediaList);
    for (let mediaId in localMediaList) {
      // Create and open an upstream sfu connection for this local media object
      let sfuLocalUpstreamCreate = rtc.SfuLocalUpstreamCreate(dispatch, mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(rtc.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.payload.connectionId));
    }
  });

  yield takeEvery(getType(rtc.ChannelLeaveResolve), function*(action: ActionType<typeof rtc.ChannelLeaveResolve>) {    
    // Remove all remote clients
    let remoteClientList = yield select((state: State) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      yield put(rtc.RemoteClientDestroy(remoteClientId));
    }
  });

  yield takeEvery(getType(rtc.RemoteClientCreate), function*(action: ActionType<typeof rtc.RemoteClientCreate>) {
    let localClientId = yield select((state: State) => state.localClientId);
    
    // For each local media object, tell the remote client to create an associated remote media object
    let localMediaList = yield select((state: State) => state.localMediaList);
    for (let mediaId in localMediaList) {
      Effect.DispatchToRemoteClient(action.payload.remoteClientId, "RemoteMediaCreate", mediaId, localMediaList[mediaId].name, localClientId);
      // If this local media object has an associated sfu upstream connection, tell the remote client to
      // create and associated sfu downstream connection
      let connectionId = yield select((state: State) => selectSfuForLocalMedia(state, mediaId))
      if (connectionId !== null) {
        Effect.DispatchToRemoteClient(action.payload.remoteClientId, "RemoteMediaSfuUpdate", mediaId, connectionId);
      }
    }
  });

  yield takeEvery(getType(rtc.RemoteClientDestroy), function*(action: ActionType<typeof rtc.RemoteClientCreate>) {
    // For each remote media object, if it is from the remote client, destroy it
    let remoteMediaList = yield select((state: State) => state.remoteMediaList);
    for (let mediaId in remoteMediaList) {
      if (remoteMediaList[mediaId].remoteClientId === action.payload) {
        yield put(rtc.RemoteMediaDestroy(mediaId));
      }
    }
  });

  yield takeEvery(getType(rtc.WebcamCaptureResolve), function*(action: ActionType<typeof rtc.WebcamCaptureResolve>) {
    // If we are connected to a channel
    let channelStatus = yield select((state: State) => state.channelStatus);
    if (channelStatus === "JOINED") {
      // For each remote client, tell it to create a remote media object associated with this local media object
      let localClientId = yield select((state: State) => state.localClientId);
      let remoteClientList = yield select((state: State) => state.remoteClientList);
      for (let remoteClientId in remoteClientList) {
        Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaCreate", action.payload.mediaId, action.payload.name, localClientId);
      }

      // Create and open an sfu upstream connection for this local media object
      let sfuLocalUpstreamCreate = rtc.SfuLocalUpstreamCreate(dispatch, action.payload.mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(rtc.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.payload.connectionId));
    }
  });

  yield takeEvery(getType(rtc.LocalMediaReleaseResolve), function*(action: ActionType<typeof rtc.LocalMediaReleaseResolve>) {
    // For each remote client, tell it to destroy the remote media object associated with this local media object
    let remoteClientList = yield select((state: State) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaDestroy", action.payload);
    }
  });

  yield takeEvery(getType(rtc.SfuLocalUpstreamCreate), function*(action: ActionType<typeof rtc.SfuLocalUpstreamCreate>) {
    // For each remote client, update the remote sfu id for the remote media object associated with this local sfu's local media object
    let remoteClientList = yield select((state: State) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaSfuUpdate", action.payload.mediaId, action.payload.connectionId);
    }
  });

  yield takeEvery(getType(rtc.RemoteMediaSfuUpdate), function*(action: ActionType<typeof rtc.RemoteMediaSfuUpdate>) {
    // (??? see below VVVVV) If we have a remote sfu upstream connection for this remote media object, create an associated sfu downstream connection
    let sfuRemoteUpstreamList = yield select((state: State) => state.sfuRemoteUpstreamList);
    if (action.payload.connectionId in sfuRemoteUpstreamList) {
      yield put(rtc.SfuDownstreamCreate(dispatch, action.payload.connectionId, action.payload.mediaId));
    }
  });

  yield takeEvery(getType(rtc.SfuRemoteUpstreamCreate), function*(action: ActionType<typeof rtc.SfuRemoteUpstreamCreate>) {
    // (??? see above ^^^^^) If we have a remote media object for this sfu remote upstream connection, create an associated sfu downstream connection
    let mediaId = yield select((state: State) => selectRemoteMediaForSfu(state, action.payload.connectionId));
    if (mediaId != null) {
      yield put(rtc.SfuDownstreamCreate(dispatch, action.payload.connectionId, mediaId));
    }
  });

  yield takeEvery(getType(rtc.SfuDownstreamCloseRequest), function*(action: ActionType<typeof rtc.SfuDownstreamCloseRequest>) {
    // Whenever we explicitly close an sfu downstream connection, create a new sfu downstream
    // connection to replace it
    let mediaId = yield select((state: State) => selectRemoteMediaForSfu(state, action.payload.connectionId));
    yield take(getType(rtc.SfuRemoteUpstreamCreate));
    yield put(rtc.SfuDownstreamCreate(dispatch, action.payload.connectionId, mediaId));
  })

  yield takeEvery(getType(rtc.SfuLocalUpstreamStatusChange), function*(action: ActionType<typeof rtc.SfuLocalUpstreamStatusChange>) {
    if (action.payload.status === 'CLOSED' || action.payload.status === 'FAILED') {
      yield put(rtc.SfuLocalUpstreamDestroy(action.payload.connectionId));
    }
  });

  yield takeEvery(getType(rtc.SfuDownstreamStatusChange), function*(action: ActionType<typeof rtc.SfuDownstreamStatusChange>) {
    if (action.payload.status === 'CLOSED' || action.payload.status === 'FAILED') {
      yield put(rtc.SfuDownstreamDestroy(action.payload.connectionId));
    }
  });
}