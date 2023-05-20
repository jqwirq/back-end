const Product = require("../models/product");
const Material = require("../models/material");

async function importProductsFromCSVs(req, res) {
  try {
    const { data } = req.body;
    const savedProductIds = [];

    // Check if data does exist
    for (const d of data) {
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
          message: `Material contains duplicate values at product number ${d.productNo}!`,
        });
      }

      // Check if materials does exist, if not, create new
      let materialIds = [];
      for (const materialNo of d.materialsNo) {
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

    return res.status(201).json(populatedProducts);
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

async function createProduct(req, res) {
  try {
    const { productNo, materialsNo } = req.body;

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
        message: "Material contains duplicate values",
      });
    }

    // Check if materials does exist, if not, create new
    let materialIds = [];
    for (const materialNo of materialsNo) {
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

module.exports = { importProductsFromCSVs, getAllProducts, createProduct };
