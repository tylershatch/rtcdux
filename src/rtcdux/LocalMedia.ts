/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

export namespace LocalMediaManager {
  // The remote client list itself
  var _mediaList: {[mediaId:string] : fm.liveswitch.LocalMedia} = {};
  export function GetMediaIds() { return Object.keys(_mediaList); }
  export function GetMedia(mediaId: string) { return _mediaList[mediaId]; }
  
  // Events emitted when local media is added/removed
  export var captureResolved = new Event<string>();
  export var captureRejected = new Event<fm.liveswitch.Exception>();
  export var releaseResolved = new Event<string>();
  export var releaseRejected = new Event<fm.liveswitch.Exception>();

  function Init() {
    // Add a window event listener for handling succesfully selecting
    // a screen to capture
    window.addEventListener('message', (event) => {
      // If this is a foreign event, discard it
      if (event.origin !== window.window.location.origin) {
        return;
      }

      // If this is the event emitted by the content script for screen selection success
      if (event.data.type && (event.data.type === 'SS_DIALOG_SUCCESS')) {
        // Create constrains for capturing the selected screen
        let constraints = {
          audio: false,
          video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: event.data.streamId,
                maxWidth: 1280,
                maxHeight: 720,
                maxFrameRate: 12
            }
          }
        };

        // Try to capture the screen
        navigator.mediaDevices.getUserMedia(constraints as any).then((stream) => {
          var localMedia = new fm.liveswitch.LocalMedia(stream, stream);
          localMedia.start().then(() => {
            var mediaId = localMedia.getId();
            _mediaList[mediaId] = localMedia;
            captureResolved.emit(mediaId);
          }).fail((error) => {
            captureRejected.emit(error);
          });
        }).catch((error) => {
          captureRejected.emit(error);
        });
      }
    });
  }

  export function CaptureWebcam() {
    var localMedia = new fm.liveswitch.LocalMedia(true, true);
    localMedia.start().then(() => {
      var mediaId = localMedia.getId();
      _mediaList[mediaId] = localMedia;
      captureResolved.emit(mediaId);
    }).fail((error) => {
      captureRejected.emit(error);
    });
  }

  export function CaptureScreen() {
    // This message is handled by the content script in the screen capture chrome plugin,
    // which brings up a\the screen selection dialog; once the dialog is completed, the plugin
    // sends its own message with the id of the selected screen, which we handle in the event
    // listener registered in the InitializeModule function above in order to actually capture
    // the screen
    window.postMessage({ type: 'SS_UI_REQUEST', text: 'start' }, '*');
  }

  export function ReleaseLocalMedia(mediaId: string) {
    _mediaList[mediaId].stop().then(() => {
      delete _mediaList[mediaId];
      releaseResolved.emit(mediaId);
    }).fail((error) => {
      releaseRejected.emit(error);
    });
  }
}