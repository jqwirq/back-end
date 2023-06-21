const SAP = require("../models/sap");

async function getAllSAP(req, res) {
  try {
    let { limit, offset, no, startDate, endDate } = req.query;

    // Parse limit and offset to integers
    limit = limit ? parseInt(limit) : undefined;
    offset = offset ? parseInt(offset) : undefined;

    // Prepare the query object
    const query = {
      isCompleted: true,
    };
    if (no) {
      query.no = no;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        // Start of the day
        query.createdAt.$gte = new Date(
          new Date(startDate).setHours(0, 0, 0, 0)
        );
      }
      if (endDate) {
        // End of the day
        query.createdAt.$lte = new Date(
          new Date(endDate).setHours(23, 59, 59, 999)
        );
      }
    }

    const total = await SAP.countDocuments(query);
    const data = await SAP.find(query).skip(offset).limit(limit);

    res.status(200).json({ message: "Success", data, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getSAPbyId(req, res) {
  try {
    const { _id } = req.params;

    const sap = await SAP.findById(_id);

    if (!sap) {
      return res.status(404).json({ message: "SAP not found" });
    }

    res.status(200).json({ message: "Success", sap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAllSAP,
  getSAPbyId,
};
