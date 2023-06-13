const SAP = require("../models/sap");
const Product = require("../models/product");

async function startWeighingProcess(req, res) {
  // Extract relevant fields from request body
  const { no, batchNo, productNo } = req.body;

  // Validate input
  if (!no || !batchNo || !productNo) {
    return res.status(400).json({ message: "Required field is missing" });
  }

  const existingProduct = await Product.findOne({ no: productNo });
  if (!existingProduct) {
    return res.status(404).json({
      message: `Product with number ${productNo} doesn't exists`,
    });
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

    if (sapDocument.materials.length === 0) {
      await SAP.deleteOne({ _id: id });
      return res.status(200).json({ message: "No material weighed" });
    }

    if (sapDocument.materials.some(m => m.isCompleted === false)) {
      return res.status(409).json({ message: "Process not finished yet" });
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
    res.status(200).json({ message: "Process stopped", SAP: updatedSAP });
  } catch (error) {
    // Handle any errors during the update operation
    res.status(500).json({ message: "Error stopping SAP document" });
  }
}

async function startMaterialWeighing(req, res) {
  try {
    // Extract relevant fields from request body
    const { id, materialNo, packaging } = req.body;

    // Validate input
    if (!id || !materialNo || !packaging) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    // Find the SAP document with the provided `id`
    const sap = await SAP.findById(id);

    if (!sap) {
      return res.status(404).json({ message: "SAP document not found" });
    }

    // Create a new material object
    const newMaterial = {
      no: materialNo,
      packaging,
      startTime: Date.now(), // Set the start time as current time
    };

    // Add the material to the `materials` array of the SAP document
    sap.materials.push(newMaterial);

    // Save the updated SAP document
    const savedSAP = await sap.save();

    // Return the updated SAP document
    // Also return the _id of the newly added material
    const material = savedSAP.materials[savedSAP.materials.length - 1];
    res.status(200).json({
      message: "Successfully added material.",
      SAP: savedSAP,
      material,
    });
  } catch (error) {
    // Handle any errors during the save operation
    res.status(500).json({ message: "Error updating SAP document" });
  }
}

async function stopMaterialWeighing(req, res) {
  try {
    const { id, materialId, quantity } = req.body;

    if (!id || !materialId) {
      return res.status(400).json({ message: "Required field is missing" });
    }

    const sap = await SAP.findById(id);

    if (!sap) {
      return res.status(404).json({ message: "SAP document not found" });
    }

    let material = sap.materials.id(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    // if (!material.isCompleted) {
    //   return res.status(404).json({ message: "Process still running" });
    // }

    const endTime = Date.now();
    material.endTime = endTime;
    material.duration = endTime - material.startTime;
    material.quantity = quantity;
    material.isCompleted = true;

    const savedSAP = await sap.save();
    material = savedSAP.materials.id(materialId);

    res.status(200).json({
      message: "Successfully updated material.",
      SAP: savedSAP,
      material,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating SAP document" });
  }
}

module.exports = {
  startWeighingProcess,
  stopWeighingProcess,
  startMaterialWeighing,
  stopMaterialWeighing,
};
