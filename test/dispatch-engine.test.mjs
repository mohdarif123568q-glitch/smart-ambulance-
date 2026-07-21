import test from "node:test";
import assert from "node:assert/strict";
import { rankDispatch, validateIncident } from "../src/dispatch-engine.mjs";

test("validates and normalizes an incident", () => {
  const incident = validateIncident({
    location: " Banjara Hills ",
    summary: "Chest pain",
    acuity: "HIGH",
    needs: ["cardiac"],
  });
  assert.equal(incident.location, "Banjara Hills");
  assert.equal(incident.acuity, "high");
});

test("ranks an ALS cardiac-equipped unit first for a critical cardiac incident", () => {
  const incident = validateIncident({
    incidentId: "INC-1",
    location: "Banjara Hills",
    summary: "Chest pain",
    acuity: "critical",
    needs: ["cardiac"],
  });
  const result = rankDispatch(incident);
  assert.equal(result.ambulance.id, "AMB-12");
  assert.equal(result.hospital.id, "HSP-01");
  assert.equal(result.priority, 4);
});

test("rejects missing incident details", () => {
  assert.throws(() => validateIncident({ acuity: "high" }), /required/);
});

test("ranks partner-supplied resources instead of demo fixtures", () => {
  const incident = validateIncident({
    incidentId: "INC-PARTNER",
    location: "Central",
    summary: "Trauma",
    acuity: "high",
    needs: ["trauma"],
  });
  const resources = {
    ambulances: [
      {
        id: "LIVE-1",
        crew: "ALS",
        distanceKm: 1,
        etaMinutes: 2,
        status: "Available",
        equipment: ["trauma"],
      },
    ],
    hospitals: [
      {
        id: "LIVE-H",
        name: "Partner Hospital",
        distanceKm: 2,
        etaMinutes: 4,
        beds: 8,
        specialties: ["trauma"],
      },
    ],
  };
  const result = rankDispatch(incident, resources);
  assert.equal(result.ambulance.id, "LIVE-1");
  assert.equal(result.hospital.id, "LIVE-H");
});
