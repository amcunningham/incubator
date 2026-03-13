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

  // Brown bin - weekly on collection day
  collections.push({
    binType: "brown",
    binColour: "#8B4513",
    label: "Brown bin (food waste)",
    frequency: "Weekly",
    nextDate: getNextWeekday(today, schedule.day),
  });

  // Black bin - find next date from list
  if (schedule.black && schedule.black.dates) {
    const nextBlack = schedule.black.dates.find((d) => d >= today);
    if (nextBlack) {
      collections.push({
        binType: "black",
        binColour: "#333333",
        label: "Black bin (general waste)",
        frequency: "Fortnightly",
        nextDate: nextBlack,
      });
    }
  }

  // Blue bin - find next date from list
  if (schedule.blue && schedule.blue.dates) {
    const nextBlue = schedule.blue.dates.find((d) => d >= today);
    if (nextBlue) {
      collections.push({
        binType: "blue",
        binColour: "#2196F3",
        label: "Blue bin (recycling)",
        frequency: "Fortnightly",
        nextDate: nextBlue,
      });
    }
  }

  // Sort by next date
  collections.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  return collections;
}

function getNextWeekday(today, dayName) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const targetDay = days.indexOf(dayName);
  const date = new Date(today + "T00:00:00");
  const currentDay = date.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  date.setDate(date.getDate() + daysUntil);
  return date.toISOString().split("T")[0];
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
