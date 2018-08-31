import { Dispatch } from 'redux';
import { put, call, select, take, takeEvery } from 'redux-saga/effects';

import * as ActionCreator from './action-creators';
import { RtcActions } from './action-types';
import { Effect } from './effects';
import { RtcState } from './reducers';

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func: any) {
  let fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

function selectSfuForLocalMedia(state: RtcState, mediaId: string) {
  for (let connectionId in state.sfuLocalUpstreamList) {
    if (state.sfuLocalUpstreamList[connectionId].mediaId === mediaId) {
      return connectionId;
    }
  }

  return null;
}

function selectRemoteMediaForSfu(state: RtcState, connectionId: string) {
  for (let mediaId in state.remoteMediaList) {
    if (state.remoteMediaList[mediaId].sfuConnectionId === connectionId) {
      return mediaId;
    }
  }

  return null;
}

// function* takeEveryTyped<ActionType extends RtcActions.ServerConnectRequest>(dispatch: Dispatch, saga: Function) {
//   const type = RtcActions.ServerConnectRequest.type;
//   yield takeEvery(type, function*(action: ActionType) {
//     yield saga(dispatch, action.payload);
//   });
// }

function selectRemoteClientForRemoteMedia(state: RtcState, mediaId: string) {
  return (state.remoteMediaList[mediaId].remoteClientId);
}

export function* rtcSaga(dispatch: Dispatch) {

  // Bind reject/resolve callbacks
  yield takeEvery('*', function*(action: RtcActions.Base){
    if (action.type.endsWith('Request')) {
      let effectName = action.type.slice(0, -'Request'.length);
      let effect = (Effect as any)[effectName];

      let resolveActionCreator = (ActionCreator as any)[effectName + "Resolve"];
      let rejectActionCreator = (ActionCreator as any)[effectName + "Reject"];
      
      try {
        let result = yield call(effect, action.payload);

        if (Object.values(getParamNames(resolveActionCreator))[0] === "dispatch") {
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

  //yield takeEveryTyped(dispatch, RtcActions.ChannelLeaveResolve, );

  yield takeEvery("ChannelJoinResolve", function*(action: RtcActions.ChannelJoinResolve) {
    // For each local media object
    let localMediaList = yield select((state: RtcState) => state.localMediaList);
    for (let mediaId in localMediaList) {
      // Create and open an upstream sfu connection for this local media object
      let sfuLocalUpstreamCreate = ActionCreator.SfuLocalUpstreamCreate(dispatch, mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(ActionCreator.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.payload.connectionId));
    }
  });

  yield takeEvery("ChannelLeaveResolve", function*(action: RtcActions.ChannelLeaveResolve) {    
    // Remove all remote clients
    let remoteClientList = yield select((state: RtcState) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      yield put(ActionCreator.RemoteClientDestroy(remoteClientId));
    }
  });

  yield takeEvery("RemoteClientCreate", function*(action: RtcActions.RemoteClientCreate) {
    let localClientId = yield select((state: RtcState) => state.localClientId);
    
    // For each local media object, tell the remote client to create an associated remote media object
    let localMediaList = yield select((state: RtcState) => state.localMediaList);
    for (let mediaId in localMediaList) {
      Effect.DispatchToRemoteClient(action.payload.remoteClientId, "RemoteMediaCreate", mediaId, localMediaList[mediaId].name, localClientId);
      // If this local media object has an associated sfu upstream connection, tell the remote client to
      // create and associated sfu downstream connection
      let connectionId = yield select((state: RtcState) => selectSfuForLocalMedia(state, mediaId))
      if (connectionId !== null) {
        Effect.DispatchToRemoteClient(action.payload.remoteClientId, "RemoteMediaSfuUpdate", mediaId, connectionId);
      }
    }
  });

  yield takeEvery("RemoteClientDestroy", function*(action: RtcActions.RemoteClientCreate) {
    // For each remote media object, if it is from the remote client, destroy it
    let remoteMediaList = yield select((state: RtcState) => state.remoteMediaList);
    for (let mediaId in remoteMediaList) {
      if (remoteMediaList[mediaId].remoteClientId === action.payload) {
        yield put(ActionCreator.RemoteMediaDestroy(mediaId));
      }
    }
  });

  yield takeEvery("WebcamCaptureResolve", function*(action: RtcActions.WebcamCaptureResolve) {
    // If we are connected to a channel
    let channelStatus = yield select((state: RtcState) => state.channelStatus);
    if (channelStatus === "JOINED") {
      // For each remote client, tell it to create a remote media object associated with this local media object
      let localClientId = yield select((state: RtcState) => state.localClientId);
      let remoteClientList = yield select((state: RtcState) => state.remoteClientList);
      for (let remoteClientId in remoteClientList) {
        Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaCreate", action.payload.mediaId, action.payload.name, localClientId);
      }

      // Create and open an sfu upstream connection for this local media object
      let sfuLocalUpstreamCreate = ActionCreator.SfuLocalUpstreamCreate(dispatch, action.payload.mediaId);
      yield put(sfuLocalUpstreamCreate);
      yield put(ActionCreator.SfuLocalUpstreamOpenRequest(sfuLocalUpstreamCreate.payload.connectionId));
    }
  });

  yield takeEvery("LocalMediaReleaseResolve", function*(action: RtcActions.LocalMediaReleaseResolve) {
    // For each remote client, tell it to destroy the remote media object associated with this local media object
    let remoteClientList = yield select((state: RtcState) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaDestroy", action.payload.mediaId);
    }
  });

  yield takeEvery("SfuLocalUpstreamCreate", function*(action: RtcActions.SfuLocalUpstreamCreate) {
    // For each remote client, update the remote sfu id for the remote media object associated with this local sfu's local media object
    let remoteClientList = yield select((state: RtcState) => state.remoteClientList);
    for (let remoteClientId in remoteClientList) {
      Effect.DispatchToRemoteClient(remoteClientId, "RemoteMediaSfuUpdate", action.payload.mediaId, action.payload.connectionId);
    }
  });

  yield takeEvery("RemoteMediaSfuUpdate", function*(action: RtcActions.RemoteMediaSfuUpdate) {
    // (??? see below VVVVV) If we have a remote sfu upstream connection for this remote media object, create an associated sfu downstream connection
    let sfuRemoteUpstreamList = yield select((state: RtcState) => state.sfuRemoteUpstreamList);
    if (action.payload.connectionId in sfuRemoteUpstreamList) {
      yield put(ActionCreator.SfuDownstreamCreate(dispatch, action.payload.connectionId, action.payload.mediaId));
    }
  });

  yield takeEvery("SfuRemoteUpstreamCreate", function*(action: RtcActions.SfuRemoteUpstreamCreate) {
    // (??? see above ^^^^^) If we have a remote media object for this sfu remote upstream connection, create an associated sfu downstream connection
    let mediaId = yield select((state: RtcState) => selectRemoteMediaForSfu(state, action.payload.connectionId));
    if (mediaId != null) {
      yield put(ActionCreator.SfuDownstreamCreate(dispatch, action.payload.connectionId, mediaId));
    }
  });

  yield takeEvery("SfuDownstreamCloseRequest", function*(action: RtcActions.SfuDownstreamCloseRequest) {
    // Whenever we explicitly close an sfu downstream connection, create a new sfu downstream
    // connection to replace it
    let mediaId = yield select((state: RtcState) => selectRemoteMediaForSfu(state, action.payload.connectionId));
    yield take("SfuDownstreamCloseResolve");
    yield put(ActionCreator.SfuDownstreamCreate(dispatch, action.payload.connectionId, mediaId));
  })

  yield takeEvery("SfuLocalUpstreamStatusChange", function*(action: RtcActions.SfuLocalUpstreamStatusChange) {
    if (action.payload.status === 'CLOSED' || action.payload.status === 'FAILED') {
      yield put(ActionCreator.SfuLocalUpstreamDestroy(action.payload.connectionId));
    }
  });

  yield takeEvery("SfuDownstreamStatusChange", function*(action: RtcActions.SfuDownstreamStatusChange) {
    if (action.payload.status === 'CLOSED' || action.payload.status === 'FAILED') {
      yield put(ActionCreator.SfuDownstreamDestroy(action.payload.connectionId));
    }
  });
}