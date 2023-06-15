const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const packagingSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
  },
  {
    collection: "packaging",
  }
);

const Packaging = mongoose.model("Packaging", packagingSchema);

module.exports = Packaging;
