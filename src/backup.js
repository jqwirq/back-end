const mongoose = require("mongoose");
const schedule = require("node-schedule");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const backupDir = "C:\\ProgramData\\Weighing";
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/weighing";

// Connect to your database
mongoose.connect(dbUrl);

const backupDatabase = () => {
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
};

const removeOldBackups = () => {
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
};

// Schedule backup task every Friday at 4 AM
const scheduleBackup = () => {
  schedule.scheduleJob("0 4 * * 5", backupDatabase);
};

backupDatabase();
removeOldBackups();

module.exports = {
  backupDatabase,
  removeOldBackups,
  scheduleBackup,
};
