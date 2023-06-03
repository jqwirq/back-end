const net = require("net");

function tcpServer() {
  const server = net.createServer((socket) => {
    socket.on("data", (data) => {
      console.log("Received data from client: ", data.toString());
      // Echo back the data to the client
      socket.write(`Server response: ${data}`);
    });

    socket.on("end", () => {
      console.log("Closing connection with the client");
    });

    socket.on("error", (err) => {
      console.log(`Error: ${err}`);
    });
  });

  // Let's start our server
  server.listen(3005, () => {
    console.log("Server started on port 3005");
  });
}

module.exports = { tcpServer };
