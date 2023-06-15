const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProcessSchema = new Schema(
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
      type: String,
      required: true,
    },
    materials: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          auto: true,
        },
        no: {
          type: String,
          required: true,
        },
        packaging: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: null,
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
        isCompleted: {
          type: Boolean,
          default: false,
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

const Process = mongoose.model("Process", ProcessSchema);

module.exports = Process;
