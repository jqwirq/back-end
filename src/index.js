require("dotenv").config();

const cors = require("cors");
const express = require("express");
const router = express.Router();
const server = express();
const mongoose = require("mongoose");
const {
  importProductsFromCSVs,
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("./controllers/productController");

// const dgram = require("dgram");
// const udpConnection = dgram.createSocket("udp4");

const port = process.env.PORT || 3001;
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/mytest";

let udpMessage = "0";
let sseId = null;

router.post("/products-csv", importProductsFromCSVs);
router.post("/product", createProduct);
router.get("/products", getAllProducts);
router.get("/product/:no", getProduct);
router.put("/product/:id", updateProduct);
router.delete("/product/:id", deleteProduct);
// router.delete('/product/:productId/material/:materialId', deleteMaterialFromProduct);

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

main();

async function main() {
  try {
    await mongoose.connect(process.env.DB_URL || dbUrl);
  } catch (err) {
    console.error(err.message); // This is bad
  }

  server.use(express.json());
  server.use(cors());

  server.use("/api", router);

  // udpConnection.on("message", (msg, rinfo) => {
  //   console.log(
  //     `UDP server received ${msg} from ${rinfo.address}:${rinfo.port}`
  //   );
  //   udpMessage = msg.toString(); // Save latest message
  // });
  // udpConnection.bind(3003);
  server.listen(port, listenCallback);
}

function listenCallback() {
  return console.log(`Example app listening on port ${port}`);
}
