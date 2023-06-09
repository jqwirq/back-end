const SAP = require("../models/sap");
const Product = require("../models/product");
const Process = require("../models/process");

const MIN_SAP_LENGTH = 4;
const MAX_SAP_LENGTH = 10;
const MIN_BATCH_LENGTH = 4;
const MAX_BATCH_LENGTH = 10;

async function startWeighingProcess(req, res) {
  // Extract relevant fields from request body
  const { no, batchNo, productNo } = req.body;

  // Validate input
  if (!no || !batchNo || !productNo) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  if (!/^\d+$/.test(no) || !/^\d+$/.test(batchNo) || !/^\d+$/.test(productNo)) {
    return res.status(400).json({
      message: `Input must be a number! Please check your input`,
    });
  }

  if (no.length < MIN_SAP_LENGTH || no.length > MAX_SAP_LENGTH) {
    return res.status(400).json({
      message: `SAP number (${no}) length should be between ${MIN_SAP_LENGTH} and ${MAX_SAP_LENGTH}. Please check your input`,
    });
  }

  if (batchNo.length < MIN_BATCH_LENGTH || batchNo.length > MAX_BATCH_LENGTH) {
    return res.status(400).json({
      message: `Batch number (${batchNo}) length should be between ${MIN_BATCH_LENGTH} and ${MAX_BATCH_LENGTH}. Please check your input`,
    });
  }

  const existingProduct = await Product.findOne({ no: productNo });
  if (!existingProduct) {
    return res.status(404).json({
      message: `Product with number ${productNo} doesn't exists`,
    });
  }

  // Create a new Process document
  const newProcess = new Process({
    no,
    batchNo,
    productNo,
    startTime: Date.now(),
    materials: [], // Starts as an empty array
  });

  try {
    // Save the document
    const savedProcess = await newProcess.save();

    // Return the newly created document
    res.status(201).json({
      message: "Process successfully started.",
      process: savedProcess,
    });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error starting new process" });
  }
}

async function stopWeighingProcess(req, res) {
  // Extract the id from the request body
  const { id, endTime } = req.body;

  // Validate input
  if (!id) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  try {
    // Find the Process document by id
    const processDocument = await Process.findById(id);

    // Check if the Process document was found
    if (!processDocument) {
      return res
        .status(404)
        .json({ message: "No process found with the provided id" });
    }

    if (processDocument.materials.length === 0) {
      await Process.deleteOne({ _id: id });
      return res.status(200).json({ message: "No material weighed" });
    }

    if (processDocument.materials.some(m => m.isCompleted === false)) {
      return res.status(409).json({ message: "Process not finished yet" });
    }

    // Calculate the duration
    // const endTime = Date.now();
    const duration = endTime - processDocument.startTime; // In milliseconds

    // Create the completed SAP document
    const completedSAP = new SAP({
      ...processDocument._doc, // copying all properties
      endTime,
      duration,
      isCompleted: true,
    });

    // Save the completed SAP document
    const savedSAP = await completedSAP.save();

    // Delete the process document
    await Process.deleteOne({ _id: id });

    // Return the newly created SAP document
    res
      .status(200)
      .json({ message: "Process successfully stopped.", SAP: savedSAP });
  } catch (error) {
    // Handle any errors during the update operation
    res.status(500).json({ message: "Error stopping process" });
  }
}

// 'startMaterialWeighing' and 'stopMaterialWeighing' functions will remain the same as they only operate on the 'Process' collection.
async function startMaterialWeighing(req, res) {
  try {
    // Extract relevant fields from request body
    const { id, materialNo, packaging } = req.body;

    // Validate input
    if (!id || !materialNo || !packaging) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    // Find the Process document with the provided `id`
    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    // Create a new material object
    const newMaterial = {
      no: materialNo,
      packaging,
      startTime: Date.now(), // Set the start time as current time
    };

    // Add the material to the `materials` array of the Process document
    process.materials.push(newMaterial);

    // Save the updated Process document
    const savedProcess = await process.save();

    // Return the updated Process document
    // Also return the _id of the newly added material
    const material = savedProcess.materials[savedProcess.materials.length - 1];
    res.status(200).json({
      message: "Successfully added material.",
      process: savedProcess,
      material,
    });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error updating Process document" });
  }
}

async function stopMaterialWeighing(req, res) {
  try {
    const { id, materialId, quantity, endTime, tolerance, targetQty } =
      req.body;

    if (
      !id ||
      !materialId ||
      !quantity ||
      !endTime ||
      !tolerance ||
      !targetQty
    ) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    let material = process.materials.id(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (tolerance === 0 || targetQty === 0 || quantity === 0) {
      return res.status(400).json({ message: "Bad request" });
    }

    const toleranceValue = (tolerance / 100) * targetQty;
    const lowerLimit = targetQty - toleranceValue;
    const upperLimit = targetQty + toleranceValue;

    const isToleranced = quantity >= lowerLimit && quantity <= upperLimit;
    if (!isToleranced) {
      return res
        .status(400)
        .json({ message: "The weight is out of tolerance!" });
    }

    // const endTime = Date.now();
    material.endTime = endTime;
    material.duration = endTime - material.startTime;
    material.quantity = quantity;
    material.isCompleted = true;

    const savedProcess = await process.save();
    material = savedProcess.materials.id(materialId);

    res.status(200).json({
      message: "Successfully updated material.",
      process: savedProcess,
      material,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating Process document" });
  }
}

async function cancelMaterialWeighing(req, res) {
  try {
    const { id, materialId } = req.body;
    // Validate input
    if (!id || !materialId) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    // Find the Process document with the provided `id`
    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    // Find the Material document with the provided `materialId`
    let material = process.materials.id(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Remove the material from the `materials` array of the Process document
    await Process.updateOne(
      { _id: id },
      { $pull: { materials: { _id: materialId } } }
    );

    // Fetch the updated Process document
    const updatedProcess = await Process.findById(id);

    res.status(200).json({
      message: "Successfully cancelled material weighing process.",
      process: updatedProcess,
    });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error updating Process document" });
  }
}

async function getProcess(req, res) {
  try {
    const { id } = req.params;
    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({ message: "Process not found" });
    }

    res.status(200).json({
      message: "Successfully load process",
      process,
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading Process document" });
  }
}

module.exports = {
  startWeighingProcess,
  stopWeighingProcess,
  startMaterialWeighing,
  stopMaterialWeighing,
  cancelMaterialWeighing,
  getProcess,
};
