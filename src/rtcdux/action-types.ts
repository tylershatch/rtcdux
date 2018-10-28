import { Action } from 'redux';

interface ActionWithPayload extends Action {
  payload: {}
}

export namespace RtcActions {

export interface ServerConnectRequest extends ActionWithPayload {
  type: "ServerConnectRequest"
}

export interface ServerConnectResolve extends ActionWithPayload {
  type: "ServerConnectResolve",
  payload: {
    localClientId: string
  }
}

export interface ServerConnectReject extends ActionWithPayload {
  type: "ServerConnectReject"
}

export interface ChannelJoinRequest extends ActionWithPayload {
  type: "ChannelJoinRequest",
  payload: {
    channelId: string
  }
}

export interface ChannelJoinResolve extends ActionWithPayload {
  type: "ChannelJoinResolve"
};

export interface ChannelJoinReject extends ActionWithPayload {
  type: "ChannelJoinReject"
}


export interface ChannelLeaveRequest extends ActionWithPayload {
  type: "ChannelLeaveRequest"
}


export interface ChannelLeaveResolve extends ActionWithPayload {
  type: "ChannelLeaveResolve"
}


export interface ChannelLeaveReject extends ActionWithPayload {
  type: "ChannelLeaveReject"
}


export interface WebcamCaptureRequest extends ActionWithPayload {
  type: "WebcamCaptureRequest"
}

export interface WebcamCaptureResolve extends ActionWithPayload {
  type: "WebcamCaptureResolve",
  payload: {
    mediaId: string,
    name: string
  }
}

export interface WebcamCaptureReject extends ActionWithPayload {
  type: "WebcamCaptureReject"
}

export interface ScreenCaptureTry extends ActionWithPayload {
  type: "ScreenCaptureTry"
}

export interface ScreenCaptureSucceed extends ActionWithPayload {
  type: "ScreenCaptureSucceed",
  payload: {
    mediaId: string,
    name: string
  }
}

export interface ScreenCaptureFail extends ActionWithPayload {
  type: "ScreenCaptureFail"
}

export interface LocalMediaReleaseRequest extends ActionWithPayload {
  type: "LocalMediaReleaseRequest"
  payload: {
    mediaId: string
  }
}

export interface LocalMediaReleaseResolve extends ActionWithPayload {
  type: "LocalMediaReleaseResolve"
  payload: {
    mediaId: string
  }
}

export interface LocalMediaReleaseReject extends ActionWithPayload {
  type: "LocalMediaReleaseReject"
  payload: {
    mediaId: string
  }
}

export interface RemoteClientCreate extends ActionWithPayload {
  type: "RemoteClientCreate",
  payload: {
    remoteClientId: string
  }
};

export interface RemoteClientDestroy extends ActionWithPayload {
  type: "RemoteClientDestroy",
  payload: {
    remoteClientId: string
  }
};

export interface RemoteMediaCreate extends ActionWithPayload {
  type: "RemoteMediaCreate",
  payload: {
    mediaId: string, 
    mediaName: string,
    mediaOwner: string,
    remoteClientId: string
  }
};

export interface RemoteMediaDestroy extends ActionWithPayload {
  type: "RemoteMediaDestroy",
  payload: {
    mediaId: string
  }
}

export interface RemoteMediaSfuUpdate extends ActionWithPayload {
  type: "RemoteMediaSfuUpdate",
  payload: {
    mediaId: string,
    connectionId: string
  }
}

export interface SfuLocalUpstreamCreate extends ActionWithPayload {
  type: "SfuLocalUpstreamCreate",
  payload: {
    connectionId: string,
    mediaId: string
  }
}

export interface SfuLocalUpstreamDestroy extends ActionWithPayload {
  type: "SfuLocalUpstreamDestroy",
  payload: {
    connectionId: string
  }
}

export interface SfuRemoteUpstreamCreate extends ActionWithPayload {
  type: "SfuRemoteUpstreamCreate",
  payload: {
    connectionId: string
  }
}

export interface SfuRemoteUpstreamDestroy extends ActionWithPayload {
  type: "SfuRemoteUpstreamDestroy",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamCreate extends ActionWithPayload {
  type: "SfuDownstreamCreate",
  payload: {
    connectionId: string,
    mediaId: string
  }
}

export interface SfuDownstreamDestroy extends ActionWithPayload {
  type: "SfuDownstreamDestroy",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamStatusChange extends ActionWithPayload {
  type: "SfuLocalUpstreamStatusChange",
  payload: {
    connectionId: string,
    status: string
  }
}

export interface SfuLocalUpstreamOpenRequest extends ActionWithPayload {
  type: "SfuLocalUpstreamOpenRequest",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamOpenResolve extends ActionWithPayload {
  type: "SfuLocalUpstreamOpenResolve",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamOpenReject extends ActionWithPayload {
  type: "SfuLocalUpstreamOpenReject",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamCloseRequest extends ActionWithPayload {
  type: "SfuLocalUpstreamCloseRequest",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamCloseResolve extends ActionWithPayload {
  type: "SfuLocalUpstreamCloseResolve",
  payload: {
    connectionId: string
  }
}

export interface SfuLocalUpstreamCloseReject extends ActionWithPayload {
  type: "SfuLocalUpstreamCloseReject",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamStatusChange extends ActionWithPayload {
  type: "SfuDownstreamStatusChange",
  payload: {
    connectionId: string,
    status: string
  }
}

export interface SfuDownstreamOpenRequest extends ActionWithPayload {
  type: "SfuDownstreamOpenRequest",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamOpenResolve extends ActionWithPayload {
  type: "SfuDownstreamOpenResolve",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamOpenReject extends ActionWithPayload {
  type: "SfuDownstreamOpenReject",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamCloseRequest extends ActionWithPayload {
  type: "SfuDownstreamCloseRequest",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamCloseResolve extends ActionWithPayload {
  type: "SfuDownstreamCloseResolve",
  payload: {
    connectionId: string
  }
}

export interface SfuDownstreamCloseReject extends ActionWithPayload {
  type: "SfuDownstreamCloseReject",
  payload: {
    connectionId: string
  }
}

export type Base = 
  | ServerConnectRequest
  | ServerConnectResolve
  | ServerConnectRequest 
  | ServerConnectResolve 
  | ServerConnectReject 
  | ChannelJoinRequest 
  | ChannelJoinResolve 
  | ChannelJoinReject 
  | ChannelLeaveRequest 
  | ChannelLeaveResolve 
  | ChannelLeaveReject 
  | WebcamCaptureRequest 
  | WebcamCaptureResolve 
  | WebcamCaptureReject 
  | LocalMediaReleaseRequest 
  | LocalMediaReleaseResolve 
  | LocalMediaReleaseReject 
  | ScreenCaptureTry
  | ScreenCaptureSucceed
  | ScreenCaptureFail
  | RemoteClientCreate 
  | RemoteClientDestroy 
  | RemoteMediaCreate 
  | RemoteMediaDestroy 
  | RemoteMediaSfuUpdate
  | SfuLocalUpstreamCreate 
  | SfuLocalUpstreamDestroy
  | SfuRemoteUpstreamCreate
  | SfuRemoteUpstreamDestroy 
  | SfuDownstreamCreate 
  | SfuDownstreamDestroy 
  | SfuLocalUpstreamStatusChange 
  | SfuLocalUpstreamOpenRequest 
  | SfuLocalUpstreamOpenResolve 
  | SfuLocalUpstreamOpenReject 
  | SfuLocalUpstreamCloseRequest 
  | SfuLocalUpstreamCloseResolve 
  | SfuLocalUpstreamCloseReject 
  | SfuDownstreamStatusChange
  | SfuDownstreamOpenRequest 
  | SfuDownstreamOpenResolve 
  | SfuDownstreamOpenReject 
  | SfuDownstreamCloseRequest
  | SfuDownstreamCloseResolve
  | SfuDownstreamCloseReject
}

// export type ServerConnectRequest = {
//   type: "ServerConnectRequest"
// }

// export type ServerConnectResolve = {
//   type: "ServerConnectResolve",
//   payload: {
//     localClientId: string
//   }
// }

// export type ServerConnectReject = {
//   type: "ServerConnectReject"
// }

// export type ChannelJoinRequest = {
//   type: "ChannelJoinRequest",
//   payload: {
//     channelId: string
//   }
// }

// export type ChannelJoinResolve = {
//   type: "ChannelJoinResolve"
// };

// export type ChannelJoinReject = {
//   type: "ChannelJoinReject"
// }


// export type ChannelLeaveRequest = {
//   type: "ChannelLeaveRequest"
// }


// export type ChannelLeaveResolve = {
//   type: "ChannelLeaveResolve"
// }


// export type ChannelLeaveReject = {
//   type: "ChannelLeaveReject"
// }


// export type WebcamCaptureRequest = {
//   type: "WebcamCaptureRequest"
// }

// export type WebcamCaptureResolve = {
//   type: "WebcamCaptureResolve",
//   payload: {
//     mediaId: string,
//     name: string
//   }
// }

// export type WebcamCaptureReject = {
//   type: "WebcamCaptureReject"
// }

// export type LocalMediaReleaseRequest = {
//   type: "LocalMediaReleaseRequest"
//   payload: {
//     mediaId: string
//   }
// }

// export type LocalMediaReleaseResolve = {
//   type: "LocalMediaReleaseResolve"
//   payload: {
//     mediaId: string
//   }
// }

// export type LocalMediaReleaseReject = {
//   type: "LocalMediaReleaseReject"
//   payload: {
//     mediaId: string
//   }
// }

// export type RemoteClientCreate = {
//   type: "RemoteClientCreate",
//   payload: {
//     remoteClientId: string
//   }
// };

// export type RemoteClientDestroy = {
//   type: "RemoteClientDestroy",
//   payload: {
//     remoteClientId: string
//   }
// };

// export type RemoteMediaCreate = {
//   type: "RemoteMediaCreate",
//   payload: {
//     mediaId: string, 
//     name: string, 
//     remoteClientId: string
//   }
// };

// export type RemoteMediaDestroy = {
//   type: "RemoteMediaDestroy",
//   payload: {
//     mediaId: string
//   }
// }

// export type RemoteMediaSfuUpdate = {
//   type: "RemoteMediaSfuUpdate",
//   payload: {
//     mediaId: string,
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamCreate = {
//   type: "SfuLocalUpstreamCreate",
//   payload: {
//     connectionId: string,
//     mediaId: string
//   }
// }

// export type SfuLocalUpstreamDestroy = {
//   type: "SfuLocalUpstreamDestroy",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuRemoteUpstreamCreate = {
//   type: "SfuRemoteUpstreamCreate",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuRemoteUpstreamDestroy = {
//   type: "SfuRemoteUpstreamDestroy",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamCreate = {
//   type: "SfuDownstreamCreate",
//   payload: {
//     connectionId: string,
//     mediaId: string
//   }
// }

// export type SfuDownstreamDestroy = {
//   type: "SfuDownstreamDestroy",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamStatusChange = {
//   type: "SfuLocalUpstreamStatusChange",
//   payload: {
//     connectionId: string,
//     status: string
//   }
// }

// export type SfuLocalUpstreamOpenRequest = {
//   type: "SfuLocalUpstreamOpenRequest",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamOpenResolve = {
//   type: "SfuLocalUpstreamOpenResolve",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamOpenReject = {
//   type: "SfuLocalUpstreamOpenReject",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamCloseRequest = {
//   type: "SfuLocalUpstreamCloseRequest",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamCloseResolve = {
//   type: "SfuLocalUpstreamCloseResolve",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuLocalUpstreamCloseReject = {
//   type: "SfuLocalUpstreamCloseReject",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamStatusChange = {
//   type: "SfuDownstreamStatusChange",
//   payload: {
//     connectionId: string,
//     status: string
//   }
// }

// export type SfuDownstreamOpenRequest = {
//   type: "SfuDownstreamOpenRequest",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamOpenResolve = {
//   type: "SfuDownstreamOpenResolve",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamOpenReject = {
//   type: "SfuDownstreamOpenReject",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamCloseRequest = {
//   type: "SfuDownstreamCloseRequest",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamCloseResolve = {
//   type: "SfuDownstreamCloseResolve",
//   payload: {
//     connectionId: string
//   }
// }

// export type SfuDownstreamCloseReject = {
//   type: "SfuDownstreamCloseReject",
//   payload: {
//     connectionId: string
//   }
// }