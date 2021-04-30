;(function () {
  "use strict"

  let connection

  // When the user ISN'T connected, only the first button is enabled.
  // When the user IS connected, only the last two buttons are enabled.
  const enableAndDisableButtons = (connected) => {
    document.getElementById("start").disabled = connected
    document.getElementById("say-hello").disabled = !connected
    document.getElementById("close").disabled = !connected
  }

  const setupWebSocketConnection = () => {
    connection = new WebSocket("ws://127.0.0.1:1337")

    // Define our event handlers
    connection.onopen = () => {
      addMessageToConsole("You are now connected!")
      enableAndDisableButtons(true)
    }

    connection.onerror = (error) => {
      console.log(`An error occurred: ${error}`)
    }

    connection.onmessage = (message) => {
      const data = JSON.parse(message.data)
      addMessageToConsole(`Client${data.client} says: ${data.text}`)
    }
  }

  const closeConnection = () => {
    connection.close()
    addMessageToConsole("You disconnected!")
    enableAndDisableButtons(false)
  }

  const addMessageToConsole = (message) => {
    const messageDiv = document.createElement("div")
    messageDiv.textContent = message
    document.getElementById("console").appendChild(messageDiv)
  }

  // Define what happens when we click on the buttons
  document.addEventListener("click", async (event) => {
    if (event.target.id === "start") {
      setupWebSocketConnection()
    } else if (event.target.id === "say-hello") {
      connection.send("Hello!")
    } else if (event.target.id === "close") {
      closeConnection()
    }
  })
})()
