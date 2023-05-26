const Product = require("../models/product");
const Material = require("../models/material");

const MIN_PRODUCT_LENGTH = 4;
const MAX_PRODUCT_LENGTH = 10;
const MIN_MATERIAL_LENGTH = 4;
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
      // .populate({
      //   path: "materials",
      //   select: "-__v -products",
      // })
      .select("-materials -__v")
      .exec();

    return res.status(200).json(products);
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while retrieving all products.",
      e,
    });
  }
}

async function getProduct(req, res) {
  try {
    const { no } = req.params;

    const product = await Product.findOne({ no: no })
      .populate({
        path: "materials",
        select: "-__v -products",
      })
      .exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json(product);
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while retrieving the product.",
      e,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(400).json({
        message: `A product with ID ${id} does not exist!`,
      });
    }

    // Go through each material ID in the product
    for (let materialId of product.materials) {
      const material = await Material.findById(materialId);

      // If a material exists and the product is the only one referencing it, delete the material
      if (
        material &&
        material.products.length === 1 &&
        material.products[0].equals(product._id)
      ) {
        await Material.findByIdAndDelete(material._id);
      }
    }

    // Finally, delete the product
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Product and orphaned materials deleted successfully!",
    });
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while deleting the product.",
      error: e,
    });
  }
}

async function deleteMaterialFromProduct(req, res) {
  try {
    const { productId, materialId } = req.params;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({
        message: `A product with ID ${productId} does not exist!`,
      });
    }

    // Check if the product has the material
    if (!product.materials.includes(materialId)) {
      return res.status(400).json({
        message: `The product with ID ${productId} does not include the material with ID ${materialId}!`,
      });
    }

    // Remove the material from the product
    product.materials = product.materials.filter(
      (id) => !id.equals(materialId)
    );
    await product.save();

    // Check if the material is referenced by any other products, if not delete the material
    const material = await Material.findById(materialId);
    if (
      material &&
      material.products.length === 1 &&
      material.products[0].equals(productId)
    ) {
      await Material.findByIdAndDelete(materialId);
    }

    return res.status(200).json({
      message:
        "Material deleted from product and orphaned material deleted successfully!",
    });
  } catch (e) {
    return res.status(500).json({
      message:
        "An error occurred while deleting the material from the product.",
      error: e,
    });
  }
}

module.exports = {
  importProductsFromCSVs,
  getAllProducts,
  getProduct,
  createProduct,
  deleteProduct,
};
