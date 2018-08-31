require("./fm.liveswitch.js");

import { Liveswitch } from "./actions";

function makePromise(requestCallback: any, resolveCallback: any) {
  return new Promise((resolve, reject) => {
    requestCallback().then((result: any) => {
      resolve(resolveCallback(result));
    }).fail((error: any) => {
      reject(error);
    });
  });
}

let g_appId = "my-app2";

export const Effect = {

  ServerConnect: function() {
    fm.liveswitch.Plugin.setChromeExtensionId('minnnhgjfmbfkdficcmlgoecchcbgnac');
  
    fm.liveswitch.Log.setLogLevel(fm.liveswitch.LogLevel.Debug);
    fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug));
  
    Liveswitch.localClient = new fm.liveswitch.Client("https://liveswitch.spatial.is:8443/sync", g_appId, "my-name4", "00000000-0000-0000-000000000000", null, ["role1", "role2"]);

    let registerToken = fm.liveswitch.Token.generateClientRegisterToken(
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
  
  ChannelJoin: function(channelId: string) {
    if (channelId === "") {
      throw new Error("Can't join channel with empty ('') channelId");
    }

    let joinToken = fm.liveswitch.Token.generateClientJoinToken(
      g_appId,
      Liveswitch.localClient.getUserId(),
      Liveswitch.localClient.getDeviceId(),
      Liveswitch.localClient.getId(),
      new fm.liveswitch.ChannelClaim(channelId),
      "--replaceThisWithYourOwnSharedSecret--"
    );
      
    return makePromise(
      () => Liveswitch.localClient.join(channelId, joinToken), 
      (channel: fm.liveswitch.Channel) => channel
    );
  },
  
  ChannelLeave: function() {
    return makePromise(
      () => Liveswitch.localClient.leave(Liveswitch.channel.getId()), 
      () => {}
    );
  },
  
  DispatchToRemoteClient: function(remoteClientId: string, actionCreator: any, ...actionCreatorArgs: any[]) {
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
    var localMedia = new fm.liveswitch.LocalMedia(true, true);
    var mediaId = localMedia.getId();

    return makePromise(
      () => localMedia.start(), 
      () => {
        Liveswitch.localMediaList[mediaId] = localMedia;
        return mediaId;
      }
    );
  },
  
  LocalMediaRelease: function(mediaId: string) {
    return makePromise(
      () => Liveswitch.localMediaList[mediaId].stop(),
      () => {
        delete Liveswitch.localMediaList[mediaId];
        return mediaId;
      }
    );
  },
  
  SfuLocalUpstreamOpen: function(connectionId: string) {
    return makePromise(
      () => Liveswitch.sfuLocalUpstreamList[connectionId].connection.open(),
      () => connectionId
    );
  },
  
  SfuLocalUpstreamClose: function(connectionId: string) {  
    return makePromise(
      () => Liveswitch.sfuLocalUpstreamList[connectionId].connection.close(),
      () => connectionId
    );
  },
  
  SfuDownstreamOpen: function(connectionId: string) {
    return makePromise(
      () => Liveswitch.sfuDownstreamList[connectionId].connection.open(),
      () => connectionId
    );
  },
  
  SfuDownstreamClose: function(connectionId: string) {
    return makePromise(
      () => Liveswitch.sfuDownstreamList[connectionId].connection.close(),
      () => connectionId
    );
  }
}