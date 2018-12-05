import * as React from 'react';
import { Component } from 'react';
import { 
  Label,
  Button,
  FormControl
} from 'react-bootstrap';

import { Room } from './rtcdux/Room';
import { LocalClient } from './rtcdux/LocalClient';
import { RemoteClientManager } from './rtcdux/RemoteClients';
import { LocalMediaManager } from './rtcdux/LocalMedia';
import { RemoteMediaManager } from './rtcdux/RemoteMedia';
import { SfuDownstreamManager } from './rtcdux/SfuDownstream';

const LocalMedia = (props) => {
  let mediaId = props.mediaId;

  return (
    <div>
      <h3>MediaId: {mediaId}</h3>
      <button onClick={() => {LocalMediaManager.ReleaseLocalMedia(mediaId)}}>X</button>
      <video autoPlay ref={(video) => {
        if (video !== null) {
          video.srcObject = LocalMediaManager.GetMedia(mediaId)._internal.video;
        }
      }}/>
    </div>
  );
}

const RemoteMedia = (props) => {
  let mediaId = props.mediaId;

  return (
    <div>
      <h3>MediaId: {mediaId}</h3>
      <h4>Status: {this.props.stats}</h4>
      <button disabled={this.props.status != "Closed"} onClick={() => SfuDownstreamManager.Open(mediaId)}>Open</button>
      <button disabled={this.props.status == "Closed"} onClick={() => SfuDownstreamManager.Close(mediaId)}>Close</button>
      <video autoPlay 
        ref = {
          (video) => {
            if (this.props.status == "Open" && video !== null) {
              video.srcObject = RemoteMediaManager.GetMedia(mediaId);
            }
          }
        }
      />
    </div>
  )
}

class Interface extends Component {
  constructor(props) {
    super(props);

    this.state = {
      localClientStatus: "Disconnected",
      roomId: "",
      roomStatus: "Disconnected",
      remoteClientList: {},
      localMediaList: {},
      remoteMediaList: {},
      sfuDownstreamStatuses: {},
    }

    LocalClient.registerResolved.on((localClient) => {
      this.setState({
        localClientStatus: "Connected"
      });
    });

    Room.joinResolved.on(() => {
      this.setState({
        roomStatus: "Connected"
      });
    });

    Room.leaveResolved.on(() => {
      this.setState({
        roomStatus: "Disconnected"
      });
    });

    RemoteClientManager.clientJoined.on((clientId) => {
      this.setState(prevState => {
        prevState.remoteClientList[clientId] = clientId;
        return prevState;
      });
    });

    RemoteClientManager.clientLeft.on((clientId) => {
      this.setState(prevState => {
        delete prevState.remoteClientList[clientId];
        return prevState;
      });
    });

    LocalMediaManager.captureResolved.on((mediaId) => {
      this.setState(prevState => {
        prevState.localMediaList[mediaId] = mediaId;
        return prevState;
      });
    });

    LocalMediaManager.releaseResolved.on((mediaId) => {
      this.setState(prevState => {
        delete prevState.localMediaList[mediaId];
        return prevState;
      });
    });

    RemoteMediaManager.created.on((mediaId) => {
      this.setState(prevState => {
        prevState.remoteMediaList[mediaId] = mediaId;
        prevState.sfuDownstreamList[mediaId] = "NoUpstream";
        return prevState;
      });
    });

    RemoteMediaManager.destroyed.on((mediaId) => {
      this.setState(prevState => {
        delete prevState.remoteMediaList[mediaId];
        delete prevState.sfuDownstreamList[mediaId];
        return prevState;
      });
    });

    SfuDownstreamManager.stateChanged.on((mediaId, state) => {
      let stateString = "";
      switch (state) {
        case SfuDownstreamManager.State.NoUpstream: stateString = "NoUpstream"; break;
        case SfuDownstreamManager.State.Closed: stateString = "Closed"; break;
        case SfuDownstreamManager.State.Opening: stateString = "Opening"; break;
        case SfuDownstreamManager.State.Open: stateString = "Open"; break;
        case SfuDownstreamManager.State.Closing: stateString = "Closing"; break;
      }

      this.setState(prevState => {
        prevState.sfuDownstreamStatuses[mediaId] = stateString;
        return prevState;
      });
    });
  };

  componentDidMount() {
    LocalClient.Register();
  }

  render() {
    // Display nothing until we are connected to the server
    if (this.state.localClientStatus == 'Disconnected') {
      return null;
    }

    return (
      <div className="App">
        <div>
          <Label>Local Client Status: {this.state.localClientStatus}</Label>
        </div>
        <div>
          <Label>Room Status: {this.state.roomStatus}</Label>
        </div>
        <div>
          <Label>Channel Id: </Label>
          <FormControl type="text" 
            value={this.state.roomId} 
            onChange={(e) => { this.setState({roomId: e.target.value})}}
            readOnly={this.state.roomStatus == "Connected"}/>
          <Button 
            onClick={() => Room.Join(this.state.roomId)} 
            disabled={this.state.roomStatus == "Connected"}
          >Join</Button>
          <Button onClick={() => Room.Leave()} disabled={this.state.roomStatus != "Connected"}>Leave</Button>
        </div>

        <div>
          <button onClick={LocalMediaManager.CaptureWebcam}>Add Webcam</button>
          <button onClick={LocalMediaManager.CaptureScreen}>Add Screen</button>
        </div>

        <div>
          <h2>Local Media</h2>
          {
            Object.keys(this.state.localMediaList).map((mediaId, index) => {
              return (
                <LocalMedia key={mediaId} mediaId={mediaId}/>
              );
            })
          }
        </div>

        <div>
          <h2>Remote Media</h2>
          <div>
            <div>
              {
                Object.keys(this.state.remoteClientList).map((remoteClientId, index) => {
                  return (
                    <div key={remoteClientId}>
                      <h3>RemoteClientId: {remoteClientId}</h3>
                      {
                        Object.keys(this.state.remoteMediaList).map((mediaId, index) => {
                          if (RemoteMediaManager.GetClientId(mediaId) === remoteClientId) {
                            for (let connectionId in this.props.sfuDownstreamList) {
                              let sfuDownstream = this.props.sfuDownstreamList[connectionId];
                              if (sfuDownstream.mediaId === mediaId) {
                                return (
                                  <RemoteMedia 
                                    key={mediaId}
                                    mediaId={mediaId} 
                                    openSfuDownstream={SfuDownstreamManager.Open} 
                                    closeSfuDownstream={SfuDownstreamManager.Close} 
                                    status={this.state.sfuDownstreamStatuses[mediaId]}
                                  />
                                );
                              }
                            }
                          }
                          
                          return null;
                        })
                      }
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <Interface />
      </div>
    );
  }
}

export default App;