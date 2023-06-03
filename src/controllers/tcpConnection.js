const net = require("net");

let tcpServers = {};

// app.get('/:port', controller);
async function startTCPServer(req, res) {
  const port = req.params.port;

  if (tcpServers[port]) {
    return res
      .status(400)
      .send({ message: `TCP Server already running on port ${port}` });
  }

  const server = net.createServer((socket) => {
    socket.on("data", (data) => {
      console.log("Received data from client: ", data.toString());
      socket.write(`Server response: ${data}`);
    });

    socket.on("end", () => {
      console.log("Closing connection with the client");
    });

    socket.on("error", (err) => {
      console.log(`Error: ${err}`);
    });
  });

  server.listen(port, () => {
    console.log(`TCP Server started on port ${port}`);
  });

  tcpServers[port] = server;

  res.send({ message: `TCP Server started on port ${port}` });
}

async function stopTCPServer(req, res) {
  const port = req.body.port;

  if (tcpServers[port]) {
    tcpServers[port].close(() => {
      console.log(`TCP Server stopped on port ${port}`);
    });
    delete tcpServers[port];
  }

  res.send({ message: `TCP Server stopped on port ${port}` });
}

// async function stopTCPServer(req, res) {
//   const port = req.body.port;

//   if (tcpServers[port]) {
//     // Retrieve all connections for this server
//     const connections = tcpServers[port]._connections;

//     // Close each connection
//     for (let connection of connections) {
//       connection.end();
//       connection.destroy();
//     }

//     // Close the server
//     tcpServers[port].close(() => {
//       console.log(`TCP Server stopped on port ${port}`);
//     });

//     delete tcpServers[port];
//   }

//   res.send({ message: `TCP Server stopped on port ${port}` });
// }

module.exports = { startTCPServer, stopTCPServer };
