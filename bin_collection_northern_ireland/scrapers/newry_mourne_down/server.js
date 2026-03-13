const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Load data
const zonesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "zones.json"), "utf8")
);
const schedulesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "schedules.json"), "utf8")
);

app.use(express.static(path.join(__dirname, "public")));

// Lookup endpoint: given a postcode, return the next collection dates
app.get("/api/lookup", (req, res) => {
  const postcode = (req.query.postcode || "").trim().toUpperCase();

  if (!postcode) {
    return res.status(400).json({ error: "Postcode is required" });
  }

  // Find the zone for this postcode
  const zoneInfo = zonesData.postcodes[postcode];
  if (!zoneInfo) {
    return res.status(404).json({
      error: "Postcode not found",
      message:
        "This postcode is not in our database yet. Newry, Mourne and Down postcodes start with: " +
        zonesData._postcodeAreas.join(", "),
    });
  }

  const scheduleKey = `${zoneInfo.day}-${zoneInfo.zone}`;
  const schedule = schedulesData.schedules[scheduleKey];
  if (!schedule) {
    return res.status(404).json({
      error: "Schedule not found",
      message: `No schedule data for ${scheduleKey} yet`,
    });
  }

  // Find next collection dates from today
  const today = new Date().toISOString().split("T")[0];
  const nextCollections = getNextCollections(schedule, today);

  res.json({
    postcode,
    day: schedule.day,
    zone: schedule.zone,
    ref: schedule.ref,
    nextCollections,
  });
});

// List all known schedule keys (for debugging/admin)
app.get("/api/schedules", (_req, res) => {
  res.json({
    schedules: Object.keys(schedulesData.schedules),
    postcodeAreas: zonesData._postcodeAreas,
    totalPostcodes: Object.keys(zonesData.postcodes).length,
  });
});

function getNextCollections(schedule, today) {
  const collections = [];
  const binTypes = [
    {
      key: "blue",
      colour: "#2196F3",
      label: "Blue bin (recycling)",
      description: "Clean, dry recyclables including glass",
    },
    {
      key: "brown",
      colour: "#8B4513",
      label: "Brown bin (food & garden waste)",
      description: "All food waste, small garden waste",
    },
    {
      key: "black",
      colour: "#333333",
      label: "Black bin (general waste)",
      description: "Non-recyclable household waste, no food",
    },
  ];

  for (const bin of binTypes) {
    const binData = schedule[bin.key];
    if (binData && binData.dates) {
      const nextDate = binData.dates.find((d) => d >= today);
      if (nextDate) {
        // Check if this is a public holiday adjusted date
        const phNote = schedule.publicHolidays
          ? schedule.publicHolidays[nextDate]
          : null;

        collections.push({
          binType: bin.key,
          binColour: bin.colour,
          label: bin.label,
          description: bin.description,
          frequency: binData.frequency,
          nextDate,
          publicHolidayNote: phNote,
        });
      }
    }
  }

  // Sort by next date
  collections.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  return collections;
}

app.listen(PORT, () => {
  console.log(`Bin collection lookup running at http://localhost:${PORT}`);
  console.log(
    `Postcodes loaded: ${Object.keys(zonesData.postcodes).length}`
  );
  console.log(
    `Schedules loaded: ${Object.keys(schedulesData.schedules).length}`
  );
});
