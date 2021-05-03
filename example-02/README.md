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

#### Answer

Bob also has to be connected to the signaling server and has to have created a RTCPeerConnection object. After Alice sends him an offer, Bob has to do following:

1. Bob receives Alice’s offer and sets it as the remote description in his RTCPeerConnection object calling _setRemoteDescription()_.
   `await peerConnection.setRemoteDescription(offerFromAlice);`

2. Bob creates a SDP answer, containing the same kind of information as the SDP offer Alice sent.
   `const answer = await peerConnection.createAnswer();`

3. Bob sets the local description of the connection to be this SDP by calling _setLocalDescription()_.
   `await peerConnection.setLocalDescription(answerFromBob);`

4. Bob sends this answer to Alice over the signaling mechanism.

```js
signaling.send(
  JSON.stringify({
    message_type: MESSAGE_TYPE.SDP,
    content: answerFromBob,
  })
)
```

We are now back at Alice. She receives Bob’s answer and sets it as the remote description in her RTCPeerConnection object calling _setRemoteDescription()_.
`await peerConnection.setRemoteDescription(answerFromBob);`

At this point, Alice and Bob have now exchanged the media data and notified each other they want to start a video chat.

They now have to share network information to establish a direct network connection if possible. This is not easy, but the ICE framework is doing it for us.

### ICE Candidates

The ICE (Interactive Connectivity Establishment) framework allows a peer to discover and communicate its public IP address.

This works thanks to the STUN server URL which we gave as a parameter in the RTCPeerConnection object. It might be that a direct connection isn't possible due to the network configuration of the peers, in which case the connection will have to happen over a relay server - a TURN server:

```js
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.test.com:19000" },
    { urls: "turn:turn:19001" },
  ],
})
```

The ICE agent takes care of this exploration and decision making for us, checks the possibility of a direct connection, and if it can’t be done, establishes the connection over a TURN server (if it has been provided).

Alice and Bob only have to listen to the event _icecandidate_ of the RTCPeerConnection. It is triggered every time a ICE candidate is found. They should then send their candidates to each other:

```js
peerConnection.onicecandidate = (iceEvent) => {
  signaling.send(
    JSON.stringify({
      message_type: MESSAGE_TYPE.CANDIDATE,
      content: iceEvent.candidate,
    })
  )
}
```

When receiving the candidate of the other, Alice and Bob should pass it to the ICE agent of their RTCPeerConnection object:

`await peerConnection.addIceCandidate(content);`

The ICE agent will take care of the negotiation and will finalize the connection.

When the connection is established, the tracks data start being exchanged over the connection. You can implement the ontrack event handler to display them:

```js
peerConnection.ontrack = (event) => {
  const video = document.getElementById("remote-view")
  if (!video.srcObject) {
    video.srcObject = event.streams[0]
  }
}
```

#### Additional resources

SUGGESTED: Review [WebRTC: the ICE Framework, STUN and TURN Servers](https://levelup.gitconnected.com/webrtc-the-ice-framework-stun-and-turn-servers-10b2972483bb)

### Client Code

According to the blog post:

> Start the WebSocket server and open the client in two different tabs. After clicking on “Start” on both pages, you should be able to communicate with yourself.

I was not able to accomplish this on macOS Big Sur. I could open multiple browsers or multiple tabs - but only see the left hand video. The main video from the other expected connection did not display as suggested.

According to the MDN Web APIs, you shouldn't use the `createOffer` legacy property. Instead, use `RTCRtpTransceiver` to control whether or not to accept incoming audio. This example isn't updated (yet - feel free to create a PR), but at least it's clear where the issue is.
