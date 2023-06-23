require("dotenv").config();

const cors = require("cors");
const express = require("express");
const router = express.Router();
const server = express();
const mongoose = require("mongoose");
const schedule = require("node-schedule");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

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

const port = process.env.PORT || 3001;
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/weighing";
const backupDir = "C:\\ProgramData\\Weighing";

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

function backupDatabase() {
  // Get current date to use in backup directory name
  const date = new Date();
  const dirname = `backup_${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}`;

  const uri = "mongodb://localhost/test"; // Replace with your MongoDB connection string
  const backupPath = path.join(backupDir, dirname);

  // Command to create the MongoDB backup
  const cmd = `mongodump --uri=${uri} --out=${backupPath}`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`Error during backup: ${error}`);
    } else {
      console.log("Backup completed successfully.");
      removeOldBackups();
    }
  });
}

function removeOldBackups() {
  fs.readdir(backupDir, (err, directories) => {
    if (err) {
      console.log(`Error reading directory: ${err}`);
      return;
    }

    // Sort the directories by creation time
    directories.sort(
      (a, b) =>
        fs.statSync(path.join(backupDir, a)).mtime.getTime() -
        fs.statSync(path.join(backupDir, b)).mtime.getTime()
    );

    // If there are more than 8 directories, remove the oldest
    if (directories.length > 8) {
      fs.rmdir(
        path.join(backupDir, directories[0]),
        { recursive: true },
        err => {
          if (err) {
            console.log(`Error deleting directory: ${err}`);
          } else {
            console.log("Old backup directory removed.");
          }
        }
      );
    }
  });
}

function scheduleBackup() {
  schedule.scheduleJob("0 4 * * 5", backupDatabase);
}
