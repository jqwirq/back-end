const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SAPSchema = new Schema(
  {
    no: {
      type: String,
      required: true,
    },
    batchNo: {
      type: String,
      required: true,
    },
    productNo: {
      // type: {
      //   _id: {
      //     type: Schema.Types.ObjectId,
      //     ref: "Product",
      //   },
      // },
      type: String,
      required: true,
    },
    materials: [
      {
        // _id: {
        //   type: Schema.Types.ObjectId,
        //   ref: "Material",
        // },
        no: {
          type: String,
          required: true,
        },
        package: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        startTime: {
          type: Number,
          default: null,
        },
        endTime: {
          type: Number,
          default: null,
        },
        duration: {
          type: Number,
          default: null,
        },
      },
    ],
    startTime: {
      type: Number,
      default: null,
    },
    endTime: {
      type: Number,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SAP = mongoose.model("product", SAPSchema);

module.exports = SAP;
