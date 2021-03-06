# Welcome

This example is based on the blog post [Set Up a Connection Over WebSocket: Video Call with WebRTC Step 2](https://levelup.gitconnected.com/set-up-a-connection-over-websocket-videochat-with-javascript-step-2-f78c307c4fd3)

![images/screenshot.png](images/screenshot.png)

To run this example from the top-level `example-01` directory:

```sh
# Start the web socket server
$ node server/index.js
```

Once the server is running, open the client HTML file - `example-01/client/index.html` - in multiple browsers.

You should be able to:

- Connect to the web socket server
- See messages from connected clients
- Say hello to connected clients
- Disconnect from the web socket server

## Core concepts

The WebRTC connection between your local browser and a remote user (peers) will use the [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)

The signaling process is not part of the WebRTC specifications - you are free to use whatever messaging protocol you'd like to establish and control the connection.

The signaling process:

- Coordinates the connection
- Exchanges messages between peers to find each other
- Controls the communication
- Terminates the connection
