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
        // Start of the day in UTC
        let startDateTime = new Date(startDate);
        startDateTime.setUTCHours(0, 0, 0, 0);
        query.createdAt.$gte = startDateTime.toISOString();
      }
      if (endDate) {
        // Start of the next day in UTC (to include the endDate in the query)
        let endDateTime = new Date(endDate);
        endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
        endDateTime.setUTCHours(0, 0, 0, 0);
        query.createdAt.$lt = endDateTime.toISOString(); // Notice the change here from $lte to $lt
      }
    }

    const total = await SAP.countDocuments(query);
    const data = await SAP.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });

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
