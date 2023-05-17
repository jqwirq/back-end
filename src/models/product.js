const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    no: {
      type: String,
      required: true,
    },
    materials: [
      {
        type: Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
