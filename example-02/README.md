# Welcome

This example is based on the blog post [Establish a WebRTC Connection: Video Call with WebRTC Step 3](https://levelup.gitconnected.com/establishing-the-webrtc-connection-videochat-with-javascript-step-3-48d4ae0e9ea4)

## Core concepts

We will create a **signaling server** that will allows peers to exchange about the media types they wish to share, to tell each other when they want to start or stop the communication, and allow peers to find each other.

Signaling is **NOT** part of the WebRTC specifications. When implementing a signaling server, you can handle messaging and the exchange of messages however you wish.

### Connection offers and answers

There are three types of messages that have to be exchanged over the signaling mechanism:

- Media data - What type of media do you want to share (audio-only? video?), and with which constraints (quality)
- Session control data to open and close the communication
- Network data - Users need to get each other's IP addresses and ports so they can check to see if a peer connection can be established

#### Offer

The blog post [Establish a WebRTC Connection: Video Call with WebRTC Step 3](https://levelup.gitconnected.com/establishing-the-webrtc-connection-videochat-with-javascript-step-3-48d4ae0e9ea4) covers this in great detail, but I wanted to provided a TL:DR of it for my own notes:

1. If not already using some communication channel with Bob, Alice should join one (we use our WebSocket server running on port 1337)
   `const signaling = new WebSocket('ws://127.0.0.1:1337');`
2. Alice creates a [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) object in her browser. It is a JavaScript interface, part of the WebRTC API, that represents the connection between the local browser and the remote peer.

```js
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.test.com:19000" }],
})
```

The parameter passed to the constructor contains the server urls needed by the ICE agent. More about this later or [here](https://levelup.gitconnected.com/webrtc-the-ice-framework-stun-and-turn-servers-10b2972483bb)

3. Alice adds the tracks (audio and video) that she wants to share over the connection to her RTCPeerConnection object.

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
})
stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))
```

4. Alice creates a SDP offer. SDP stands for [Session Description Protocol](https://en.wikipedia.org/wiki/Session_Description_Protocol)
   `const offer = await peerConnection.createOffer();`

It is the format used to describe the communication parameters. It contains the media description and network information, and looks like this:

```
v=0
o=alice 123456789 123456789 IN IP4 some-host.com
s=-
c=IN IP4 some-host.com
t=0 0
m=audio 49170 RTP/AVP 0
a=rtpmap:0 PCMU/8000
m=audio 49170 RTP/AVP 31
a=rtpmap:31 H261/90000
m=audio 49170 RTP/AVP 32
a=rtpmap:32 MPV/90000
```

5. Alice sets the local description of the connection to be this SDP by calling _setLocalDescription()_
   `await peerConnection.setLocalDescription(offer);`

6. Alice sends this offer to Bob over the signaling server.

```js
signaling.send(
  JSON.stringify({
    message_type: MESSAGE_TYPE.SDP,
    content: offer,
  })
)
```
