const Product = require("../models/product");
const Material = require("../models/material");

async function createProducts(req, res) {
  try {
    const { data } = req.body;
    const savedProductIds = [];

    // Check if data does exist
    for (const d of data) {
      // Check if product does exist return response status 400
      const existingProduct = await Product.findOne({ no: d.productNo });
      if (existingProduct) {
        return res.status(400).json({
          message: `A product with number ${d.productNo} already exists`,
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
    console.error(e);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the product" });
  }
}

async function getAllProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 1;
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
      e,
      message: "An error occurred while retrieving all products",
    });
  }
}

async function onta2(req, res) {
  try {
    const { data } = req.body;
    const savedProductIds = [];

    // Check if data does exist
    for (const d of data) {
      // Check if product does exist
      const existingProduct = await Product.findOne({ no: d.productNo });
      if (existingProduct) {
        return res.status(400).json({
          message: `A product with number ${d.productNo} already exists`,
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
    console.error(e);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the product" });
  }
}

async function onta(req, res) {
  try {
    const { data } = req.body;
    const savedProductIds = [];

    // Check for duplicate
    for (const d of data) {
      let materialIds = [];

      for (const materialNo of d.materialsNo) {
        let materialDoc = await Material.findOne({ no: materialNo });

        if (materialDoc) {
          return res.status(400).json({
            message: `Material with number ${materialNo} does not exist`,
          });
        }

        materialIds.push(materialDoc._id);
      }

      const existingProduct = await Product.findOne({
        materials: { $all: materialIds },
      });

      if (existingProduct) {
        return res.status(400).json({
          message: `A product with the same materials already exists with id ${existingProduct._id}`,
        });
      }
    }

    // Proceed with creation
    for (const d of data) {
      let materialIds = d.materialIds; // Use the material IDs directly from the data

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
    console.error(e);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the product" });
  }
}

module.exports = { createProducts, getAllProducts };
