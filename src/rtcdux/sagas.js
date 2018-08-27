import { put, call, select, takeEvery } from 'redux-saga/effects'

import { ActionType } from './action-types';
import { ActionCreator } from './action-creators';
import { Effect } from './effects';

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  let fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

export function* rtcSaga(dispatch) {

  // Bind reject/resolve callbacks
  yield takeEvery('*', function*(action){
    if (action.type.endsWith('Request')) {
      let effectName = action.type.slice(0, -'Request'.length);

      let effect = Effect[effectName];
      let effectParams = getParamNames(effect).map((name) => ((name === "dispatch") ? dispatch : action[name]));

      let resolveActionCreator = ActionCreator[effectName + "Resolve"];
      let rejectActionCreator = ActionCreator[effectName + "Reject"];
      
      try {
        let params = getParamNames(resolveActionCreator);
        let passDispatch = Object.values(params)[0] === "dispatch";
        let result = yield call(effect, ...effectParams);
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

  yield takeEvery(ActionType.ChannelJoinResolve, function*(action) {
    // For each local media object
    let localMediaList = yield select((state) => state.localMediaList);
    for (let mediaId in localMediaList) {

      // Create and open an upstream sfu connection for this local media object
      let sfuLocalUpstreamCreate = ActionCreator.SfuLocalUpstreamCreate(dispatch, mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(ActionCreator.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.connectionId));

      // For each remote client, tell it to create a remote media object associated with this local media object
      let localClientId = yield select((state) => state.localClientId);
      let remoteClientList = yield select((state) => state.remoteClientList);
      for (let remoteClientId in remoteClientList) {
        Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaCreate", mediaId, localMediaList[mediaId].name, localClientId, localMediaList[mediaId].sfuConnectionId);
      }
    }
  });

  yield takeEvery(ActionType.ChannelLeaveResolve, function*(action) {    
    // Remove all remote clients
    let remoteClientList = yield select((state) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      yield put(ActionCreator.RemoteClientDestroy(remoteClientId));
    }
  });

  yield takeEvery(ActionType.RemoteClientCreate, function*(action) {
    let localClientId = yield select((state) => state.localClientId);
    
    // For each local media object, tell the remote client to create an associated remote media object
    let localMediaList = yield select((state) => state.localMediaList);
    for (let mediaId in localMediaList) {
      Effect.DispatchToRemoteClient(action.remoteClientId, "RemoteMediaCreate", mediaId, localMediaList[mediaId].name, localMediaList[mediaId].sfuConnectionId);
    }
  });

  yield takeEvery(ActionType.RemoteClientDestroy, function*(action) {
    // For each local media object, tell the remote client to destroy its associated remote media object
    let localMediaList = yield select((state) => state.localMediaList);
    for (let mediaId in localMediaList) {
      Effect.DispatchToRemoteClient(action.remoteClientId, "RemoteMediaDestroy", mediaId);
    }
  });

  yield takeEvery(ActionType.WebcamCaptureResolve, function*(action) {
    // If we are connected to a channel, create and open an sfu upstream connection for this local media object
    let channelStatus = yield select((state) => state.channelStatus);
    if (channelStatus === "JOINED") {
      let sfuLocalUpstreamCreate = ActionCreator.SfuLocalUpstreamCreate(dispatch, action.mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(ActionCreator.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.connectionId));

      // For each remote client, tell it to create a remote media object associated with thie local media object
      let localClientId = yield select((state) => state.localClientId);
      let remoteClientList = yield select((state) => state.remoteClientList);
      for (let remoteClientId in remoteClientList) {
        Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaCreate", action.mediaId, action.name, localClientId, sfuLocalUpstreamCreate.connectionId);
      }
    }
  });

  yield takeEvery(ActionType.RemoteMediaCreate, function*(action) {
    // If we have a remote sfu upstream connection for this remote media object, create an associated sfu downstream connection
    let sfuRemoteUpstreamList = yield select((state) => state.sfuRemoteUpstreamList);
    if (action.sfuConnectionId in sfuRemoteUpstreamList) {
      yield put(ActionCreator.SfuDownstreamCreate(dispatch, action.sfuConnectionId, action.mediaId, action.remoteClientId));
    }
  });

  yield takeEvery(ActionType.SfuRemoteUpstreamCreate, function*(action) {
    // If we have a remote media object for this sfu remote upstream connection, create an associated sfu downstream connection
    let remoteMediaList = yield select((state) => state.remoteMediaList);
    for (let mediaId in remoteMediaList) {
      if (remoteMediaList[mediaId].sfuConnectionId == action.connectionId) {
        yield put(ActionCreator.SfuDownstreamCreate(dispatch, action.connectionId, mediaId, action.remoteClientId));
        break;
      }
    }
  });

  yield takeEvery(ActionType.SfuLocalUpstreamStatusChange, function*(action) {
    if (action.status === 'CLOSED' || action.status === 'FAILED') {
      yield put(ActionCreator.SfuLocalUpstreamDestroy(action.connectionId));
    }
  });

  yield takeEvery(ActionType.SfuDownstreamStatusChange, function*(action) {
    if (action.status === 'CLOSED' || action.status === 'FAILED') {
      yield put(ActionCreator.SfuDownstreamDestroy(action.connectionId));
    }
  });
}