const dgram = require("dgram");
const udpConnection = dgram.createSocket("udp4");

// let udpMessage = "0";
// let sseId = null;

// router.get("/events", (req, res) => {
//   // Set response headers
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const msg = `${udpMessage}\n\n`;
//   res.write(msg);

//   // Send an event every second
//   sseId = setInterval(() => {
//     const message = `data: ${udpMessage}\n\n`;
//     if (!res.write(message)) {
//       clearInterval(sseId);
//     }
//   }, 1000);

//   // Close event if client disconnects
//   req.on("close", () => {
//     clearInterval(sseId);
//   });
// });

// main()

function main() {
  udpConnection.on("message", (msg, rinfo) => {
    console.log(
      `UDP server received ${msg} from ${rinfo.address}:${rinfo.port}`
    );
    udpMessage = msg.toString(); // Save latest message
  });
  udpConnection.bind(3003);
}
