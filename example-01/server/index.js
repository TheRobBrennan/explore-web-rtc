const http = require("http")
const server = require("websocket").server

// First, let's create an HTTP server
const httpServer = http.createServer(() => {})
httpServer.listen(1337, () => {
  console.log("Server listening at port 1337")
})

// WebSocket is designed to work over HTTP, so we can use the HTTP server we defined above
const wsServer = new server({
  httpServer,
})

// The clients array will keep track of connected users
let clients = []

// When a client requests a connection
wsServer.on("request", (request) => {
  // Accept the connection request
  const connection = request.accept()
  // Generate an ID for the connection - a random-ish value suffices for this example
  const id = Math.floor(Math.random() * 100)

  // Notify every connected client that we have a new connection
  clients.forEach((client) =>
    client.connection.send(
      JSON.stringify({
        client: id,
        text: "I am now connected",
      })
    )
  )

  // Add our client connection and ID to the array
  clients.push({ connection, id })

  // When the client sends a message, the "message" event is emitted
  connection.on("message", (message) => {
    // Send the message to every connected client EXCEPT the client sending the message
    clients
      .filter((client) => client.id !== id)
      .forEach((client) =>
        client.connection.send(
          JSON.stringify({
            client: id,
            text: message.utf8Data,
          })
        )
      )
  })

  // When the client disconnects, remove it from the clients array and notify all connected clients
  connection.on("close", () => {
    clients = clients.filter((client) => client.id !== id)
    clients.forEach((client) =>
      client.connection.send(
        JSON.stringify({
          client: id,
          text: "I disconnected",
        })
      )
    )
  })
})
