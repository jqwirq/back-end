const net = require("net");

async function startTCPServer(req, res) {
  const port = req.params.port;

  if (tcpServers[port]) {
    return res.status(400).send(`TCP Server already running on port ${port}`);
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

  res.send(`TCP Server started on port ${port}`);
}
module.exports = { startTCPServer };
