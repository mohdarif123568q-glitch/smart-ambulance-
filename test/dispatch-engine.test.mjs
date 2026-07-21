import test from "node:test";
import assert from "node:assert/strict";
import { rankDispatch, validateIncident } from "../src/dispatch-engine.mjs";

test("validates and normalizes an incident", () => {
  const incident = validateIncident({ location: " Banjara Hills ", summary: "Chest pain", acuity: "HIGH", needs: ["cardiac"] });
  assert.equal(incident.location, "Banjara Hills");
  assert.equal(incident.acuity, "high");
});

test("ranks an ALS cardiac-equipped unit first for a critical cardiac incident", () => {
  const incident = validateIncident({ incidentId: "INC-1", location: "Banjara Hills", summary: "Chest pain", acuity: "critical", needs: ["cardiac"] });
  const result = rankDispatch(incident);
  assert.equal(result.ambulance.id, "AMB-12");
  assert.equal(result.hospital.id, "HSP-01");
  assert.equal(result.priority, 4);
});

test("rejects missing incident details", () => {
  assert.throws(() => validateIncident({ acuity: "high" }), /required/);
});
