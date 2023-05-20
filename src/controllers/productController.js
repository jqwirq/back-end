const Product = require("../models/product");
const Material = require("../models/material");

const MIN_PRODUCT_LENGTH = 8;
const MAX_PRODUCT_LENGTH = 10;
const MIN_MATERIAL_LENGTH = 8;
const MAX_MATERIAL_LENGTH = 10;

async function importProductsFromCSVs(req, res) {
  try {
    const { data } = req.body;
    const savedProductIds = [];

    for (const d of data) {
      // Check if product number is not a string of number
      if (!/^\d+$/.test(d.productNo)) {
        return res.status(400).json({
          message: `Product number (${d.productNo}) must be a number! Please check your input!`,
        });
      }

      // Check for product the length
      if (
        d.productNo.length < MIN_PRODUCT_LENGTH ||
        d.productNo.length > MAX_PRODUCT_LENGTH
      ) {
        return res.status(400).json({
          message: `Product number (${d.productNo}) length should be between 10 and 12. Please check your input!`,
        });
      }

      // Check if product does exist return response status 400
      const existingProduct = await Product.findOne({ no: d.productNo });
      if (existingProduct) {
        return res.status(400).json({
          message: `A product with number ${d.productNo} already exists!`,
        });
      }

      // Check for duplicate material
      if (new Set(d.materialsNo).size !== d.materialsNo.length) {
        return res.status(400).json({
          message: `Your input contains duplicate material number at product number ${d.productNo}!`,
        });
      }

      let materialIds = [];
      for (const materialNo of d.materialsNo) {
        // Check if material number is not a string of number
        if (!/^\d+$/.test(materialNo)) {
          return res.status(400).json({
            message: `Material number must be a number! Please check your input!`,
          });
        }

        // Check for material the length
        if (
          materialNo.length < MIN_MATERIAL_LENGTH ||
          materialNo.length > MAX_MATERIAL_LENGTH
        ) {
          return res.status(400).json({
            message: `Material number length should be between 10 and 12. Please check your input!`,
          });
        }

        // Check if materials does exist, if not, create new
        let materialDoc = await Material.findOne({ no: materialNo });
        if (!materialDoc) {
          materialDoc = new Material({ no: materialNo });
          await materialDoc.save();
        }
        materialIds.push(materialDoc._id);
      }

      const newProduct = new Product({
        no: d.productNo,
        materials: materialIds,
      });

      const savedProduct = await newProduct.save();
      savedProductIds.push(savedProduct._id);

      await Material.updateMany(
        { _id: { $in: materialIds } },
        { $push: { products: savedProduct._id } }
      );
    }

    const populatedProducts = await Product.find({
      _id: { $in: savedProductIds },
    })
      .populate({
        path: "materials",
        select: "-__v -products",
      })
      .lean()
      .exec();

    return res
      .status(201)
      .json({ message: "Import data success!", populatedProducts });
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while creating the product.",
      error: e,
    });
  }
}

async function createProduct(req, res) {
  try {
    const { productNo, materialsNo } = req.body;

    // Check if product number is not a string of number
    if (!/^\d+$/.test(productNo)) {
      return res.status(400).json({
        message: `Product number must be a number! Please check your input!`,
      });
    }

    // Check for product the length
    if (
      productNo.length < MIN_PRODUCT_LENGTH ||
      productNo.length > MAX_PRODUCT_LENGTH
    ) {
      return res.status(400).json({
        message: `Product number length should be between 10 and 12. Please check your input!`,
      });
    }

    // Check if product does exist return response status 400
    const existingProduct = await Product.findOne({ no: productNo });
    if (existingProduct) {
      return res.status(400).json({
        message: `A product with number ${productNo} already exists!`,
      });
    }

    // Check for duplicate material
    if (new Set(materialsNo).size !== materialsNo.length) {
      return res.status(400).json({
        message:
          "Your input contains duplicate material number. Please check again!",
      });
    }

    // Check if materials does exist, if not, create new
    let materialIds = [];
    for (const materialNo of materialsNo) {
      // Check if material number is not a string of number
      if (!/^\d+$/.test(materialNo)) {
        return res.status(400).json({
          message: `Material number must be a number! Please check your input!`,
        });
      }

      // Check for material the length
      if (
        materialNo.length < MIN_MATERIAL_LENGTH ||
        materialNo.length > MAX_MATERIAL_LENGTH
      ) {
        return res.status(400).json({
          message: `Material number length should be between 10 and 12. Please check your input!`,
        });
      }

      let materialDoc = await Material.findOne({ no: materialNo });
      if (!materialDoc) {
        materialDoc = new Material({ no: materialNo });
        await materialDoc.save();
      }
      materialIds.push(materialDoc._id);
    }

    const newProduct = new Product({
      no: productNo,
      materials: materialIds,
    });

    const savedProduct = await newProduct.save();

    await Material.updateMany(
      { _id: { $in: materialIds } },
      { $push: { products: savedProduct._id } }
    );
    const populatedProducts = await Product.find({
      _id: savedProduct._id,
    })
      .populate({
        path: "materials",
        select: "-__v -products",
      })
      .lean()
      .exec();

    return res
      .status(201)
      .json({ message: "Input success!", populatedProducts });
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while creating the product.",
      error: e,
    });
  }
}

async function getAllProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const offset = parseInt(req.query.offset) || 0;

    const products = await Product.find({})
      .skip(offset)
      .limit(limit)
      .populate({
        path: "materials",
        select: "-__v -products",
      })
      .exec();

    return res.status(200).json(products);
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while retrieving all products.",
      e,
    });
  }
}

module.exports = { importProductsFromCSVs, getAllProducts, createProduct };
