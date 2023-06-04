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
const {
  startWeighingProcess,
  stopWeighingProcess,
  startMaterialWeighing,
  stopMaterialWeighing,
} = require("./controllers/weighingController");
const {
  startTCPServer,
  stopTCPServer,
} = require("./controllers/tcpConnection");
// const { tcpServer } = require("./testTcp");

const port = process.env.PORT || 3001;
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/mytest";

router.post("/products-csv", importProductsFromCSVs);
router.post("/product", createProduct);
router.get("/products", getAllProducts);
router.get("/product/:no", getProduct);
router.put("/product/:id", updateProduct);
router.delete("/product/:id", deleteProduct);
// router.delete('/product/:productId/material/:materialId', deleteMaterialFromProduct);

router.post("/weighing-process/start", startWeighingProcess);
router.post("/weighing-process/stop", stopWeighingProcess);
router.post("/material-weighing/start", startMaterialWeighing);
router.post("/material-weighing/stop", stopMaterialWeighing);

// router.get("/weighing/start-tcp/:port", startTCPServer);
// router.post("/weighing/stop-tcp", stopTCPServer);

main();

async function main() {
  try {
    await mongoose.connect(process.env.DB_URL || dbUrl);
  } catch (err) {
    // console.error(err.message); // This is bad
  }

  server.use(express.json());
  server.use(cors());

  server.use("/api", router);
  // tcpServer();

  server.listen(port, listenCallback);
}

function listenCallback() {
  return console.log(`Example app listening on port ${port}`);
}
