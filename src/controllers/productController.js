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
          message: `Product number (${d.productNo}) must be a number! Please check your input`,
        });
      }

      // Check for product the length
      if (
        d.productNo.length < MIN_PRODUCT_LENGTH ||
        d.productNo.length > MAX_PRODUCT_LENGTH
      ) {
        return res.status(400).json({
          message: `Product number (${d.productNo}) length should be between 10 and 12. Please check your input`,
        });
      }

      // Check if product does exist return response status 400
      const existingProduct = await Product.findOne({ no: d.productNo });
      if (existingProduct) {
        return res.status(400).json({
          message: `A product with number ${d.productNo} already exists`,
        });
      }

      // Check for duplicate material
      if (new Set(d.materialsNo).size !== d.materialsNo.length) {
        return res.status(400).json({
          message: `Your input contains duplicate material number at product number ${d.productNo}`,
        });
      }

      let materialIds = [];
      for (const materialNo of d.materialsNo) {
        // Check if material number is not a string of number
        if (!/^\d+$/.test(materialNo)) {
          return res.status(400).json({
            message: `Material number must be a number! Please check your input`,
          });
        }

        // Check for material the length
        if (
          materialNo.length < MIN_MATERIAL_LENGTH ||
          materialNo.length > MAX_MATERIAL_LENGTH
        ) {
          return res.status(400).json({
            message: `Material number length should be between 10 and 12. Please check your input`,
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
      .json({ message: "Import data success", populatedProducts });
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while creating the product",
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
        message: `Product number must be a number! Please check your input`,
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
        message: `A product with number ${productNo} already exists`,
      });
    }

    // Check for duplicate material
    if (new Set(materialsNo).size !== materialsNo.length) {
      return res.status(400).json({
        message:
          "Your input contains duplicate material number. Please check again",
      });
    }

    // Check if materials does exist, if not, create new
    let materialIds = [];
    for (const materialNo of materialsNo) {
      // Check if material number is not a string of number
      if (!/^\d+$/.test(materialNo)) {
        return res.status(400).json({
          message: `Material number must be a number! Please check your input`,
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
    const no = req.query.no || "";

    let query = {};
    if (no) {
      query.no = no;
    }

    const products = await Product.find(query)
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

function isNotDigits(s) {
  return !/^\d+$/.test(s);
}

function isProductNoOutOfLength(s) {
  return s.length < MIN_PRODUCT_LENGTH || s.length > MAX_PRODUCT_LENGTH;
}

function isMaterialNoOutOfLength(s) {
  return s.length < MIN_MATERIAL_LENGTH || s.length > MAX_MATERIAL_LENGTH;
}

function isMaterialDuplicate(a) {
  return new Set(a).size !== a.length;
}

async function updateProduct(req, res) {
  try {
    const { id: productId } = req.params;
    const { productNo: newProductNo, materialsNo: newMaterialsNo } = req.body;

    // Check if new product is empty
    if (newProductNo === "") {
      return res.status(400).json({
        message: `Product number is empty! Please check your input!`,
      });
    }

    // Check if new product number is a string of number
    if (isNotDigits(newProductNo)) {
      return res.status(400).json({
        message: `Product number must be a number! Please check your input!`,
      });
    }

    // Check for new product number length
    if (isProductNoOutOfLength(newProductNo)) {
      return res.status(400).json({
        message: `Product number length should be between 10 and 12. Please check your input!`,
      });
    }

    // Check if new product number already exists
    const existingProduct = await Product.findOne({ no: newProductNo });
    if (existingProduct && existingProduct._id.toString() !== productId) {
      return res.status(400).json({
        message: `A product with number ${newProductNo} already exists!`,
      });
    }

    // Check if materials no is empty
    if (newMaterialsNo.length === 0) {
      return res.status(400).json({
        message:
          "Your input doesn't contains material numbers. Please check again!",
      });
    }

    // Check for duplicate new material number
    if (isMaterialDuplicate(newMaterialsNo)) {
      return res.status(400).json({
        message:
          "Your input contains duplicate material numbers. Please check again!",
      });
    }

    // Process new materials if exist
    let newMaterialIds = [];
    if (newMaterialsNo) {
      for (const materialNo of newMaterialsNo) {
        // Check if new material number is a string of number
        if (isNotDigits(materialNo)) {
          return res.status(400).json({
            message: `Material number must be a number! Please check your input!`,
          });
        }

        // Check for new material number length
        if (isMaterialNoOutOfLength(materialNo)) {
          return res.status(400).json({
            message: `Material number length should be between 10 and 12. Please check your input!`,
          });
        }

        let materialDoc = await Material.findOne({ no: materialNo });
        if (!materialDoc) {
          materialDoc = new Material({ no: materialNo });
          await materialDoc.save();
        }
        newMaterialIds.push(materialDoc._id);
      }
    }

    const productToUpdate = await Product.findById(productId);
    if (!productToUpdate) {
      return res.status(404).json({
        message: `Product with id ${productId} does not exist.`,
      });
    }

    const oldMaterialIds = productToUpdate.materials;

    // Check if the new product number is the same as the current one
    if (productToUpdate.no !== newProductNo) {
      productToUpdate.no = newProductNo;
    }

    // Process new materials if exist
    productToUpdate.materials = newMaterialIds;

    await productToUpdate.save();

    // Remove product from old materials
    await Material.updateMany(
      { _id: { $in: oldMaterialIds } },
      { $pull: { products: productId } }
    );

    // Add product to new materials
    await Material.updateMany(
      { _id: { $in: newMaterialIds } },
      { $addToSet: { products: productId } }
    );

    // Delete orphaned materials
    const orphanedMaterials = await Material.find({
      _id: { $in: oldMaterialIds },
      products: { $size: 0 },
    });
    await Material.deleteMany({
      _id: { $in: orphanedMaterials.map((orphan) => orphan._id) },
    });

    // Add product to new materials
    await Material.updateMany(
      { _id: { $in: newMaterialIds } },
      { $push: { products: productId } }
    );

    const populatedProduct = await Product.findById(productId)
      .populate({
        path: "materials",
        select: "-__v -products",
      })
      .lean()
      .exec();

    return res
      .status(200)
      .json({ message: "Update success!", populatedProduct });
  } catch (e) {
    return res.status(500).json({
      message: "An error occurred while updating the product.",
      error: e,
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
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
