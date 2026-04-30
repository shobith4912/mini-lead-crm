const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  source: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"],
    default: "NEW"
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});


const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;