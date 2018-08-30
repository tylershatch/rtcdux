import { Liveswitch, LiveswitchApi } from './liveswitch';
// import { Promise } from 'es6-promise';

function makePromise(requestCallback, resolveCallback) {
  return new Promise((resolve, reject) => {
    requestCallback().then((result) => {
      resolve(resolveCallback(result));
    }).fail((error) => {
      reject(error);
    });
  });
}

let g_appId = "my-app2";

export const Effect = {

  ServerConnect: function() {
    LiveswitchApi.Plugin.setChromeExtensionId('minnnhgjfmbfkdficcmlgoecchcbgnac');
  
    LiveswitchApi.Log.setLogLevel(LiveswitchApi.LogLevel.Debug);
    LiveswitchApi.Log.registerProvider(new LiveswitchApi.ConsoleLogProvider(LiveswitchApi.LogLevel.Debug));
  
    Liveswitch.localClient = new LiveswitchApi.Client("https://liveswitch.spatial.is:8443/sync", g_appId, "my-name4", "00000000-0000-0000-000000000000", null, ["role1", "role2"]);

    let registerToken = LiveswitchApi.Token.generateClientRegisterToken(
      g_appId,
      Liveswitch.localClient.getUserId(),
      Liveswitch.localClient.getDeviceId(),
      Liveswitch.localClient.getId(),
      Liveswitch.localClient.getRoles(),
      null,
      "--replaceThisWithYourOwnSharedSecret--"
    );

    return makePromise(
      () => Liveswitch.localClient.register(registerToken),
      () => Liveswitch.localClient.getId()
    );
  },
  
  ChannelJoin: function(channelId) {
    if (channelId === "") {
      throw new Error("Can't join channel with empty ('') channelId");
    }

    let joinToken = LiveswitchApi.Token.generateClientJoinToken(
      g_appId,
      Liveswitch.localClient.getUserId(),
      Liveswitch.localClient.getDeviceId(),
      Liveswitch.localClient.getId(),
      new LiveswitchApi.ChannelClaim(channelId),
      "--replaceThisWithYourOwnSharedSecret--"
    );
      
    return makePromise(
      () => Liveswitch.localClient.join(channelId, joinToken), 
      (channel) => channel
    );
  },
  
  ChannelLeave: function() {
    return makePromise(
      () => Liveswitch.localClient.leave(Liveswitch.channel.getId()), 
      () => {}
    );
  },
  
  DispatchToRemoteClient: function(remoteClientId, actionCreator, ...actionCreatorArgs) {
    Liveswitch.channel.sendClientMessage(
      Liveswitch.remoteClientList[remoteClientId].getUserId(), 
      Liveswitch.remoteClientList[remoteClientId].getDeviceId(), 
      remoteClientId, 
      JSON.stringify({
        actionCreator,
        actionCreatorArgs
      })
    );
  },
  
  WebcamCapture: function() {
    var localMedia = new LiveswitchApi.LocalMedia(true, true);
    var mediaId = localMedia.getId();

    return makePromise(
      () => localMedia.start(), 
      () => {
        Liveswitch.localMediaList[mediaId] = localMedia;
        return mediaId;
      }
    );
  },
  
  LocalMediaRelease: function(mediaId) {
    return makePromise(
      () => Liveswitch.localMediaList[mediaId].stop(),
      () => {
        delete Liveswitch.localMediaList[mediaId];
        return mediaId;
      }
    );
  },
  
  SfuLocalUpstreamOpen: function(connectionId) {
    return makePromise(
      () => Liveswitch.sfuLocalUpstreamList[connectionId].connection.open(),
      () => connectionId
    );
  },
  
  SfuLocalUpstreamClose: function(connectionId) {  
    return makePromise(
      () => Liveswitch.sfuLocalUpstreamList[connectionId].connection.close(),
      () => connectionId
    );
  },
  
  SfuDownstreamOpen: function(connectionId) {
    return makePromise(
      () => Liveswitch.sfuDownstreamList[connectionId].connection.open(),
      () => connectionId
    );
  },
  
  SfuDownstreamClose: function(connectionId) {
    return makePromise(
      () => Liveswitch.sfuDownstreamList[connectionId].connection.close(),
      () => connectionId
    );
  }
}