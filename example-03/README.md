# Welcome

This example is based on the blog post [Find Your Contact: Video Call with WebRTC Step 4](https://levelup.gitconnected.com/find-your-contact-videochat-with-javascript-step-4-4d527576b8cf)

At the end of the previous example (example-02), we have established a WebRTC connection between two peers. Such a connection can only be set up after exchanging messages between the peers over a signaling mechanism. This mechanism isn’t part of the specifications and can be freely chosen. We used WebSocket, but until now, our signaling is extremely simple and broadcasts any message of a user to all other connected users. That means that the WebRTC connections are randomly established between users.

For the purposes of having reference code, I am going to bring in the previous example code and tweak as necessary.
