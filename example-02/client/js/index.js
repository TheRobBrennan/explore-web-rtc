;(function () {
  "use strict"

  // Define the message types that the user can expect to receive
  const MESSAGE_TYPE = {
    SDP: "SDP", // Offers and answers
    CANDIDATE: "CANDIDATE", // ICE candidates
  }

  document.addEventListener("click", async (event) => {
    if (event.target.id === "start") {
      startChat()
    }
  })

  const startChat = async () => {
    try {
      // Request data from the camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })

      // Once the user has granted permission, we can show the chat room
      showChatRoom()

      // Establish a connection to our WebSocket server
      const signaling = new WebSocket("ws://127.0.0.1:1337")
      const peerConnection = createPeerConnection(signaling) // NOTE: We are using a fake STUN server for this example.

      // After creating the RTCPeerConnection object, we need to handle receiving a message
      addMessageHandler(signaling, peerConnection)

      // Set our local tracks to the RTCPeerConnection object and display them in the desired video element
      //  NOTE: Setting the tracks on the peer connection object will trigger the negogationneeded event, and the event listener
      //  will call the createAndSendOffer function.
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream))
      document.getElementById("self-view").srcObject = stream
    } catch (err) {
      console.error(err)
    }
  }

  const createPeerConnection = (signaling) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.test.com:19000" }], // NOTE: This is a fake STUN server. You can replace it with a public one.
    })

    // This event is super important. It is fired when we add tracks to the connection, and later when something happens that requires a renegotiation.
    //    TL:DR This event is where the signaling exchange will actually get started.
    peerConnection.onnegotiationneeded = async () => {
      await createAndSendOffer()
    }

    // Send ICE candidates to the peers
    peerConnection.onicecandidate = (iceEvent) => {
      if (iceEvent && iceEvent.candidate) {
        signaling.send(
          JSON.stringify({
            message_type: MESSAGE_TYPE.CANDIDATE,
            content: iceEvent.candidate,
          })
        )
      }
    }

    // Set the received tracks to our video HTML element
    peerConnection.ontrack = (event) => {
      const video = document.getElementById("remote-view")
      if (!video.srcObject) {
        video.srcObject = event.streams[0]
      }
    }

    return peerConnection
  }

  const addMessageHandler = (signaling, peerConnection) => {
    signaling.onmessage = async (message) => {
      const data = JSON.parse(message.data)

      if (!data) {
        return
      }

      const { message_type, content } = data
      try {
        if (message_type === MESSAGE_TYPE.CANDIDATE && content) {
          // If we receive a candidate, give it to the ICE agent
          await peerConnection.addIceCandidate(content)
        } else if (message_type === MESSAGE_TYPE.SDP) {
          if (content.type === "offer") {
            // If we receive an offer:
            //  - Set the remote description
            //  - Create an answer
            //  - Save the answer as a local description
            //  - Send it to the peer
            await peerConnection.setRemoteDescription(content)
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            signaling.send(
              JSON.stringify({
                message_type: MESSAGE_TYPE.SDP,
                content: answer,
              })
            )
          } else if (content.type === "answer") {
            // If we receive an answer:
            //  - Set it as the local offer
            await peerConnection.setRemoteDescription(content)
          } else {
            console.log("Unsupported SDP type.")
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const createAndSendOffer = async (signaling, peerConnection) => {
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    signaling.send(
      JSON.stringify({ message_type: MESSAGE_TYPE.SDP, content: offer })
    )
  }

  const showChatRoom = () => {
    document.getElementById("start").style.display = "none"
    document.getElementById("chat-room").style.display = "block"
  }
})()
