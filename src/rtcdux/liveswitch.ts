export const Liveswitch = {
  localClient: null,
  channel: null,
  remoteClientList: {},
  localMediaList: {},
  remoteMediaList: {},
  sfuLocalUpstreamList: {},
  sfuRemoteUpstreamList: {},
  sfuDownstreamList: {},
  getLocalVideoStream: (mediaId) => Liveswitch.localMediaList[mediaId]._getInternal()._videoMediaStream,
  getRemoteVideoStream: (mediaId) => Liveswitch.remoteMediaList[mediaId]._getInternal()._videoMediaStream,
}

export const LiveswitchApi = (window as any).fm.liveswitch;