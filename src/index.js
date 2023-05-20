require("dotenv").config();

const cors = require("cors");
const express = require("express");
const router = express.Router();
const server = express();
const mongoose = require("mongoose");
const {
  importProductsFromCSVs,
  getAllProducts,
  createProduct,
} = require("./controllers/productController");

const port = process.env.PORT || 3001;
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/mytest";

router.post("/products-csv", importProductsFromCSVs);
router.post("/product", createProduct);
router.get("/products", getAllProducts);

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

  server.listen(port, listenCallback);
}

function listenCallback() {
  return console.log(`Example app listening on port ${port}`);
}
