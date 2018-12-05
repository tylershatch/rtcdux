/// <reference path="../vendor/fm.liveswitch.d.ts" />
require("../vendor/fm.liveswitch.js");

import { LocalClient } from "./LocalClient";
import { Event, Signal } from "ts-typed-events";

export namespace Room {
  // The room itself ('channel' in LiveSwitch parlance)
  var _room: fm.liveswitch.Channel = null;
  export function Get() { return _room; }

  // The room state
  export enum State {
    NotInRoom,
    Joining,
    Joined,
    Leaving
  }
  var _state = State.NotInRoom;
  export function GetState() { return _state; }

  // Events emitted when async leave/join async calls complete
  export var joinResolved = new Event<fm.liveswitch.Channel>();
  export var joinRejected = new Event<fm.liveswitch.Exception>();
  export var leaveResolved = new Signal();
  export var leaveRejected = new Event<fm.liveswitch.Exception>();

  // Join the room with id: roomId
  export function Join(roomId: string) {
    // Make sure we are in a valid state before doing anything
    if (roomId === "") {
      throw new Error("rtc Server.JoinRoom error: can't join room with empty ('') roomId");
    } else if (_state != State.NotInRoom) {
      throw new Error("rtc Server.JoinRoom error: can't join room when room state=" + _state);
    } else if (LocalClient.GetState() != LocalClient.State.Registered) {
      throw new Error("rtc Server.JoinRoom error: can't join room when local client state=" + LocalClient.GetState());
    }

    // We are now joining
    _state = State.Joining;

    // Create a liveswitch authentication token for joining the room
    let joinToken = fm.liveswitch.Token.generateClientJoinToken(
      LocalClient.appId,
      LocalClient.Get().getUserId(),
      LocalClient.Get().getDeviceId(),
      LocalClient.Get().getId(),
      new fm.liveswitch.ChannelClaim(roomId),
      "--replaceThisWithYourOwnSharedSecret--"
    );
      
    // Try to join the room
    LocalClient.Get().join(roomId, joinToken).then((channel) => {
      _state = State.Joined;
      _room = channel;
      joinResolved.emit(channel);
    }).fail((error) => {
      _state = State.NotInRoom;
      joinRejected.emit(error);
    });
  }

  // Leave the current room
  export function Leave() {
    // Make sure we are in a valid state before doing anything
    if (_state != State.Joined) {
      throw new Error("rtc Server.LeaveRoom error: can't leave room when room state=" + _state);
    }

    // We are now leaving
    _state = State.Leaving;

    // Try to leave the room
    LocalClient.Get().leave(_room.getId()).then(() => {
      _room = null;
      _state = State.NotInRoom;
      leaveResolved.emit();
    }).fail((error) => {
      _state = State.Joined;
      leaveRejected.emit(error);
    });
  }
}