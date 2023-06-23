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
  getProcess,
} = require("./controllers/updateController");
const { getAllSAP, getSAPbyId } = require("./controllers/sapController");
const {
  getPackaging,
  registerUser,
  signInUser,
  changePassword,
} = require("./controllers/controller");
const { scheduleBackup } = require("./backup");

const port = process.env.PORT || 3001;
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/weighing";

router.post("/products-csv", importProductsFromCSVs);
router.post("/product", createProduct);
router.get("/products", getAllProducts);
router.get("/product/:no", getProduct);
router.put("/product/:id", updateProduct);
router.put("/delete-product/:id", deleteProduct);

router.post("/weighing-process/start", startWeighingProcess);
router.post("/weighing-process/stop", stopWeighingProcess);
router.post("/material-weighing/start", startMaterialWeighing);
router.post("/material-weighing/stop", stopMaterialWeighing);
router.get("/process/:id", getProcess);

router.get("/sap-list", getAllSAP);
router.get("/sap/:_id", getSAPbyId);

router.get("/packaging", getPackaging);
router.post("/user/register", registerUser);
router.post("/user/sign/in", signInUser);
router.post("/user/password/change", changePassword);

main();

async function main() {
  try {
    await mongoose.connect(dbUrl);
  } catch (err) {
    console.error(err.message); // This is bad
  }

  scheduleBackup();

  server.use(express.json());
  server.use(cors());

  server.use("/api", router);

  server.listen(port, listenCallback);
}

function listenCallback() {
  return console.log(`Example app listening on port ${port}`);
}
