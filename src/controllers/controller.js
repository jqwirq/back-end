const Packaging = require("../models/packaging");

async function getPackaging(req, res) {
  try {
    const packaging = await Packaging.find();
    return res.status(200).json({ message: "Success", data: packaging });
  } catch (err) {
    return res.status(500).json({
      message: "An error occurred while retrieving all products.",
      err,
    });
  }
}

module.exports = { getPackaging };
