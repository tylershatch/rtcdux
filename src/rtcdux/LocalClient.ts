/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { Event } from "ts-typed-events";

export namespace LocalClient {
  // The liveswitch server id for this app
  export const appId: string = "spatial";

  // The local client itself
  var _localClient: fm.liveswitch.Client;
  export function Get() { return _localClient; }

  // The state of the local client
  export enum State {
    Unregistered,
    Registering,
    Registered
  }
  var _state = State.Unregistered;
  export function GetState() { return _state; }

  // Events emitted when the async register call completes
  export var registerResolved = new Event<fm.liveswitch.Client>();
  export var registerRejected = new Event<fm.liveswitch.Exception>();

  // Register this client
  export function Register() {
    // Make sure we are in a valid state before doing anything
    if (_state != State.Unregistered) {
      throw new Error("rtc LocalClient.Register error: can't register when local client state=" + _state)
    }

    // We are now registering
    _state = State.Registering;

    // Setup liveswitch logging
    fm.liveswitch.Log.setLogLevel(fm.liveswitch.LogLevel.Debug);
    fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug));
  
    // Create the local client
    _localClient = new fm.liveswitch.Client(
      "https://liveswitch.spatial.is:8443/sync", 
      appId, 
      "my-name4", 
      "00000000-0000-0000-000000000000", 
      null, 
      ["role1", "role2"]);

    // Create a liveswitch authentication token for registering this client
    let registerToken = fm.liveswitch.Token.generateClientRegisterToken(
      appId,
      _localClient.getUserId(),
      _localClient.getDeviceId(),
      _localClient.getId(),
      _localClient.getRoles(),
      "",
      "--replaceThisWithYourOwnSharedSecret--"
    );

    // Try to register this client
    _localClient.register(registerToken).then(() => {
      _state = State.Registered;
      registerResolved.emit(_localClient);
    }).fail((error) => {
      _state = State.Unregistered;
      registerRejected.emit(error);
    });
  }
}