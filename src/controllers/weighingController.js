const SAP = require("../models/sap");

async function startWeighingProcess(req, res) {
  // Extract relevant fields from request body
  const { no, batchNo, productNo } = req.body;

  // Validate input
  if (!no || !batchNo || !productNo) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  // Create a new SAP document
  const newSAP = new SAP({
    no,
    batchNo,
    productNo,
    startTime: Date.now(),
    materials: [], // Starts as an empty array
  });

  try {
    // Save the document
    const savedSAP = await newSAP.save();

    // Return the newly created document
    res.status(201).json({ message: "Successfully created.", SAP: savedSAP });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error creating SAP document" });
  }
}

async function stopWeighingProcess(req, res) {
  // Extract the id from the request body
  const { id } = req.body;

  // Validate input
  if (!id) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  try {
    // Find the SAP document by id
    const sapDocument = await SAP.findById(id);

    // Check if the SAP document was found
    if (!sapDocument) {
      return res
        .status(404)
        .json({ message: "No SAP document found with the provided id" });
    }

    // Calculate the duration
    const endTime = Date.now();
    const duration = endTime - sapDocument.startTime; // In milliseconds

    // Update the SAP document
    sapDocument.endTime = endTime;
    sapDocument.duration = duration;
    sapDocument.isCompleted = true;

    // Save the updated SAP document
    const updatedSAP = await sapDocument.save();

    // Return the updated document
    res.status(200).json(updatedSAP);
  } catch (error) {
    // Handle any errors during the update operation
    res.status(500).json({ message: "Error stopping SAP document" });
  }
}

async function startMaterialWeighing(req, res) {
  // Extract relevant fields from request body
  const { no, materialNo, package, quantity } = req.body;

  // Validate input
  if (!no || !materialNo || !package || !quantity) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  // Find the SAP document with the provided `no`
  const sap = await SAP.findOne({ no: no });

  if (!sap) {
    return res.status(404).json({ message: "SAP document not found" });
  }

  // Create a new material object
  const newMaterial = {
    no: materialNo,
    package: package,
    quantity: quantity,
    startTime: Date.now(), // Set the start time as current time
  };

  // Add the material to the `materials` array of the SAP document
  sap.materials.push(newMaterial);

  try {
    // Save the updated SAP document
    const savedSAP = await sap.save();

    // Return the updated SAP document
    res
      .status(200)
      .json({ message: "Successfully added material.", SAP: savedSAP });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error updating SAP document" });
  }
}

async function stopMaterialWeighing(req, res) {
  // Extract relevant fields from request body
  const { id, materialNo } = req.body;

  // Validate input
  if (!id || !materialNo) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  // Find the SAP document by id
  const sapDocument = await SAP.findById(id);

  // Check if the SAP document was found
  if (!sapDocument) {
    return res
      .status(404)
      .json({ message: "No SAP document found with the provided id" });
  }

  // Find the material in the `materials` array by `materialNo`
  const material = sapDocument.materials.find((m) => m.no === materialNo);

  // Check if the material was found
  if (!material) {
    return res
      .status(404)
      .json({ message: "No material found with the provided material number" });
  }

  // Calculate the duration
  const endTime = Date.now();
  const duration = endTime - material.startTime; // In milliseconds

  // Update the material
  material.endTime = endTime;
  material.duration = duration;

  try {
    // Save the updated SAP document
    const updatedSAP = await sapDocument.save();

    // Return the updated SAP document
    res.status(200).json(updatedSAP);
  } catch (error) {
    // Handle any errors during the update operation
    res.status(500).json({ message: "Error updating material" });
  }
}

module.exports = { startWeighingProcess, stopWeighingProcess };
