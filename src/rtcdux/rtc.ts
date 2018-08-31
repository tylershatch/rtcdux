export const internal = {
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
  }
}

// _getInternal is not an exposed typescript method of fm.liveswitch, so we must strip the type by using 'as any'
export function getLocalVideoStream(mediaId: string) { 
  return (internal.localMediaList[mediaId] as any)._getInternal()._videoMediaStream;
}

// _getInternal is not an exposed typescript method of fm.liveswitch, so we must strip the type by using 'as any'
export function getRemoteVideoStream(mediaId: string) {
  return (internal.remoteMediaList[mediaId] as any)._getInternal()._videoMediaStream;
}