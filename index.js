const express = require("express");
const mongoose = require("mongoose");
const Lead = require("./models/Lead");

const app = express();
app.use(express.json());

//  CACHE SETUP (LEVEL 3) 
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

function setCache(id, data) {
  cache.set(id, {
    data,
    expires: Date.now() + CACHE_TTL
  });
}

function getCache(id) {
  const entry = cache.get(id);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    cache.delete(id);
    return null;
  }

  return entry.data;
}

function invalidateCache(id) {
  cache.delete(id);
}

//  DB 
mongoose.connect("mongodb://127.0.0.1:27017/mini-crm")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

//  ROOT 
app.get("/", (req, res) => {
  res.send("API running ");
});


//  CREATE 
app.post("/leads", async (req, res) => {
  try {
    const { name, email, phone, source } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const lead = new Lead({ name, email, phone, source });
    await lead.save();

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET ALL 
app.get("/leads", async (req, res) => {
  try {
    const { status } = req.query;

    const leads = status
      ? await Lead.find({ status })
      : await Lead.find();

    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET BY ID (CACHED) 
app.get("/leads/:id", async (req, res) => {
  try {
    const id = req.params.id;

    //  check cache first
    const cached = getCache(id);
    if (cached) {
      return res.json(cached);
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    //  store in cache
    setCache(id, lead);

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  UPDATE 
app.put("/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    Object.assign(lead, req.body);
    await lead.save();

    //  invalidate cache
    invalidateCache(req.params.id);

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  DELETE 
app.delete("/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    //  invalidate cache
    invalidateCache(req.params.id);

    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  STATUS 
const validTransitions = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["QUALIFIED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: []
};

app.patch("/leads/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    if (!validTransitions[lead.status].includes(status)) {
      return res.status(400).json({
        error: `Invalid transition from ${lead.status} to ${status}`
      });
    }

    lead.status = status;
    await lead.save();

    //  invalidate cache
    invalidateCache(req.params.id);

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// BULK CREATE 
app.post("/leads/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }

    const results = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < req.body.length; i++) {
      const item = req.body[i];

      if (!item.name || !item.email) {
        failed++;
        results.push({ index: i, success: false, error: "name and email required" });
        continue;
      }

      try {
        const lead = new Lead(item);
        await lead.save();

        success++;
        results.push({ index: i, success: true, lead });
      } catch (err) {
        failed++;
        results.push({ index: i, success: false, error: err.message });
      }
    }

    res.status(207).json({
      total: req.body.length,
      successful: success,
      failed,
      results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  BULK UPDATE 
app.put("/leads/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }

    const results = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < req.body.length; i++) {
      const item = req.body[i];

      try {
        if (!item.id) {
          failed++;
          results.push({ index: i, success: false, error: "id is required" });
          continue;
        }

        const lead = await Lead.findById(item.id);

        if (!lead) {
          failed++;
          results.push({ index: i, success: false, error: "Lead not found" });
          continue;
        }

        Object.assign(lead, item);
        await lead.save();

        //  invalidate cache
        invalidateCache(item.id);

        success++;
        results.push({ index: i, success: true, lead });

      } catch (err) {
        failed++;
        results.push({ index: i, success: false, error: err.message });
      }
    }

    res.status(207).json({
      total: req.body.length,
      successful: success,
      failed,
      results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// START 
app.listen(3000, () => {
  console.log("Server running on port 3000");
});