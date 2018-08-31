import * as React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux'
import { 
  Label,
  Button,
  FormControl
} from 'react-bootstrap';

import * as rtc from './rtcdux/actions';
import { Liveswitch } from './rtcdux/actions';

const LocalMedia = (props) => {
  let mediaId = props.mediaId;

  return (
    <div>
      <h3>MediaId: {mediaId}</h3>
      <button onClick={() => props.releaseLocalMedia(mediaId)}>X</button>
      <video autoPlay ref={(video) => {
        if (video !== null) {
          video.srcObject = Liveswitch.getLocalVideoStream(mediaId);
        }
      }}/>
    </div>
  );
}

const RemoteMedia = (props) => {
  let mediaId = props.mediaId;
  let sfuConnectionId = props.sfuConnectionId;

  return (
    <div>
      <h3>MediaId: {mediaId}</h3>
      <button disabled={!props.closed} onClick={() => props.openSfuDownstream(sfuConnectionId)}>Open</button>
      <button disabled={!props.open} onClick={() => props.closeSfuDownstream(sfuConnectionId)}>Close</button>
      <video autoPlay 
        ref = {
          (video) => {
            if (props.open && video !== null) {
              video.srcObject = Liveswitch.getRemoteVideoStream(mediaId);
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
      channelId: ""
    }
  };

  componentDidMount() {
    this.props.connectToServer();
  }

  render() {
    // Display nothing until we are connected to the server
    if (this.props.localClientId == null) {
      return null;
    }

    return (
      <div className="App">

        <div>
          <Label>Channel Status: {this.props.channelStatus} | Channel Id: </Label>
          <FormControl type="text" 
            value={this.state.channelId} 
            onChange={(e) => { this.setState({channelId: e.target.value})}}
            readOnly={!this.props.canJoinChannel}/>
          <Button onClick={() => this.props.joinChannel(this.state.channelId)} disabled={!this.props.canJoinChannel}>Join</Button>
          <Button onClick={() => this.props.leaveChannel()} disabled={!this.props.canLeaveChannel}>Leave</Button>
        </div>

        <div>
          <button onClick={this.props.captureWebcam}>Add Webcam</button>
        </div>

        <div>
          <h2>Local Media</h2>
          {
            Object.keys(this.props.localMediaList).map((mediaId, index) => {
              return (
                <LocalMedia key={mediaId} mediaId={mediaId} releaseLocalMedia={this.props.releaseLocalMedia}/>
              );
            })
          }
        </div>

        <div>
          <h2>Remote Media</h2>
          <div>
            <div>
              {
                Object.keys(this.props.remoteClientList).map((remoteClientId, index) => {
                  return (
                    <div key={remoteClientId}>
                      <h3>RemoteClientId: {remoteClientId}</h3>
                      {
                        Object.keys(this.props.remoteMediaList).map((mediaId, index) => {
                          let remoteMedia = this.props.remoteMediaList[mediaId];
                          if (remoteMedia.remoteClientId === remoteClientId) {
                            for (let connectionId in this.props.sfuDownstreamList) {
                              let sfuDownstream = this.props.sfuDownstreamList[connectionId];
                              if (sfuDownstream.mediaId === mediaId) {
                                return (
                                  <RemoteMedia 
                                    key={mediaId}
                                    mediaId={mediaId} 
                                    sfuConnectionId={remoteMedia.sfuConnectionId} 
                                    openSfuDownstream={this.props.openSfuDownstream} 
                                    closeSfuDownstream={this.props.closeSfuDownstream}
                                    closed={sfuDownstream.status === "NEW"}
                                    open={sfuDownstream.status === "CONNECTED"}
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

const mapStateToProps = (state) => {
  return {
    localClientId: state.localClientId,
    channelStatus: state.channelStatus,
    remoteClientList: state.remoteClientList,
    localMediaList: state.localMediaList,
    remoteMediaList: state.remoteMediaList,
    sfuDownstreamList: state.sfuDownstreamList,

    canJoinChannel:
      state.channelStatus === "NEW" ||
      state.channelStatus === "JOIN_FAILED" ||
      state.channelStatus === 'LEFT',
  
    canLeaveChannel:
      state.channelStatus === "JOINED" ||
      state.channelStatus === "LEAVE_FAILED",
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    connectToServer: () => {
      dispatch(rtc.ServerConnectRequest());
    },

    joinChannel: (channelId) => {
      dispatch(rtc.ChannelJoinRequest(channelId));
    },

    leaveChannel: () => {
      dispatch(rtc.ChannelLeaveRequest());
    },

    captureWebcam: () => {
      dispatch(rtc.WebcamCaptureRequest());
    },

    releaseLocalMedia: (mediaId) => {
      dispatch(rtc.LocalMediaReleaseRequest(mediaId));
    },
    
    openSfuDownstream: (connectionId) => {
      dispatch(rtc.SfuDownstreamOpenRequest(connectionId));
    },

    closeSfuDownstream: (connectionId) => {
      dispatch(rtc.SfuDownstreamCloseRequest(connectionId));
    }
  }
}

const BoundInterface = connect(
  mapStateToProps,
  mapDispatchToProps
)(Interface)

class App extends Component {
  render() {
    return (
      <div className="App">
        <BoundInterface />
      </div>
    );
  }
}

export default App;