# Welcome

This example is based on the blog post [Find Your Contact: Video Call with WebRTC Step 4](https://levelup.gitconnected.com/find-your-contact-videochat-with-javascript-step-4-4d527576b8cf)

At the end of the previous example (example-02), we have established a WebRTC connection between two peers. Such a connection can only be set up after exchanging messages between the peers over a signaling mechanism. This mechanism isn’t part of the specifications and can be freely chosen. We used WebSocket, but our signaling is extremely simple and broadcasts any message of a user to all other connected users. That means that the WebRTC connections are randomly established between users.

For the purposes of having reference code, I will bring in the previous example code and tweak it as necessary.

## Core concepts

### Establish the Connection with the Code

We now need to adapt the signaling mechanism to exchange messages only between peers having given the same code.

We create an object _peersByCode_. In this object, the codes are going to be the keys, and the values are going to be arrays of connections, looking like this:

```json
{
  123456789: [
   { id: 1234, connection: ... },
   { id: 5678, connection: ... },
  ],
  789012345: [
   { id: 4321, connection: ... },
   { id: 8765, connection: ... },
  ],
}
```

When a peer sends a message over the signaling mechanism, they send the code with the message. We first check if the code is already a key in the _peersByCode_ object. If not, we add it. We also check if the peer’s connection object is already in the array of connections for this code. If not, we add it. Finally, we send the message to all the peers having this code, except, of course, the one having sent the message.

We established the connection between two given peers and not between random ones. In a real-life application, users would be getting this code from a third party. For example, let’s say your aim is to allow employers and applicants to organize interviews over WebRTC. The employer would create a meeting in your application, and the employer and applicant would receive a link to the chat room. The code would probably be given in the invitation email in this case or be directly included in the link they receive.
