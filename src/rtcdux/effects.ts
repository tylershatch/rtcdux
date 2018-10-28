/// <reference path="./fm.liveswitch.d.ts" />
require("./fm.liveswitch.js");

import * as rtc from "./rtc";

function makePromise(requestCallback: any, resolveCallback: any) {
  return new Promise((resolve, reject) => {
    requestCallback().then((result: any) => {
      resolve(resolveCallback(result));
    }).fail((error: any) => {
      reject(error);
    });
  });
}

let g_appId = "Spatial";

export const Effect = {

  DispatchToRemoteClient: function(remoteClientId: string, actionCreator: any, ...actionCreatorArgs: any[]) {
    rtc.internal.channel.sendClientMessage(
      rtc.internal.remoteClientList[remoteClientId].getUserId(), 
      rtc.internal.remoteClientList[remoteClientId].getDeviceId(), 
      remoteClientId, 
      JSON.stringify({
        actionCreator,
        actionCreatorArgs
      })
    );
  },

  ServerConnect: function() {
    fm.liveswitch.Plugin.setChromeExtensionId('minnnhgjfmbfkdficcmlgoecchcbgnac');
  
    fm.liveswitch.Log.setLogLevel(fm.liveswitch.LogLevel.Debug);
    fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug));
  
    rtc.internal.localClient = new fm.liveswitch.Client("https://liveswitch.spatial.is:8443/sync", g_appId, "my-name4", "00000000-0000-0000-000000000000", null, ["role1", "role2"]);

    let registerToken = fm.liveswitch.Token.generateClientRegisterToken(
      g_appId,
      rtc.internal.localClient.getUserId(),
      rtc.internal.localClient.getDeviceId(),
      rtc.internal.localClient.getId(),
      rtc.internal.localClient.getRoles(),
      "",
      "--replaceThisWithYourOwnSharedSecret--"
    );

    return makePromise(
      () => rtc.internal.localClient.register(registerToken),
      () => rtc.internal.localClient.getId()
    );
  },
  
  ChannelJoin: function(payload : {channelId: string}) {
    if (payload.channelId === "") {
      throw new Error("Can't join channel with empty ('') channelId");
    }

    let joinToken = fm.liveswitch.Token.generateClientJoinToken(
      g_appId,
      rtc.internal.localClient.getUserId(),
      rtc.internal.localClient.getDeviceId(),
      rtc.internal.localClient.getId(),
      new fm.liveswitch.ChannelClaim(payload.channelId),
      "--replaceThisWithYourOwnSharedSecret--"
    );
      
    return makePromise(
      () => rtc.internal.localClient.join(payload.channelId, joinToken), 
      (channel: fm.liveswitch.Channel) => channel
    );
  },
  
  ChannelLeave: function() {
    return makePromise(
      () => rtc.internal.localClient.leave(rtc.internal.channel.getId()), 
      () => {}
    );
  },
  
  WebcamCapture: function() {
    var localMedia = new fm.liveswitch.LocalMedia(true, true);
    var mediaId = localMedia.getId();

    return makePromise(
      () => localMedia.start(), 
      () => {
        rtc.internal.localMediaList[mediaId] = localMedia;
        return mediaId;
      }
    );
  },
  
  LocalMediaRelease: function(payload: {mediaId: string}) {
    return makePromise(
      () => rtc.internal.localMediaList[payload.mediaId].stop(),
      () => {
        delete rtc.internal.localMediaList[payload.mediaId];
        return payload.mediaId;
      }
    );
  },
  
  SfuLocalUpstreamOpen: function(payload: {connectionId: string}) {
    return makePromise(
      () => rtc.internal.sfuLocalUpstreamList[payload.connectionId].connection.open(),
      () => payload.connectionId
    );
  },
  
  SfuLocalUpstreamClose: function(payload: {connectionId: string}) {  
    return makePromise(
      () => rtc.internal.sfuLocalUpstreamList[payload.connectionId].connection.close(),
      () => payload.connectionId
    );
  },
  
  SfuDownstreamOpen: function(payload: {connectionId: string}) {
    return makePromise(
      () => rtc.internal.sfuDownstreamList[payload.connectionId].connection.open(),
      () => payload.connectionId
    );
  },
  
  SfuDownstreamClose: function(payload: {connectionId: string}) {
    return makePromise(
      () => rtc.internal.sfuDownstreamList[payload.connectionId].connection.close(),
      () => payload.connectionId
    );
  }
}