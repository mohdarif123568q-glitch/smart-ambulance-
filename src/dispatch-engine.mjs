export const ambulances = [
  { id: "AMB-12", crew: "ALS", distanceKm: 2.4, etaMinutes: 5, status: "Available", equipment: ["cardiac", "oxygen", "trauma"] },
  { id: "AMB-07", crew: "BLS", distanceKm: 3.8, etaMinutes: 8, status: "Available", equipment: ["oxygen", "trauma"] },
  { id: "AMB-19", crew: "ALS", distanceKm: 6.1, etaMinutes: 11, status: "Returning", equipment: ["cardiac", "oxygen", "ventilator"] }
];

export const hospitals = [
  { id: "HSP-01", name: "CityCare Medical Center", distanceKm: 4.2, etaMinutes: 9, beds: 6, specialties: ["cardiac", "trauma", "stroke"] },
  { id: "HSP-02", name: "St. Anne Emergency Hospital", distanceKm: 5.7, etaMinutes: 12, beds: 11, specialties: ["trauma", "pediatric"] },
  { id: "HSP-03", name: "Metro Heart Institute", distanceKm: 7.1, etaMinutes: 15, beds: 4, specialties: ["cardiac", "stroke"] }
];

const acuityWeight = { critical: 4, high: 3, medium: 2, low: 1 };

export function rankDispatch(incident) {
  const needs = new Set((incident.needs || []).map((item) => item.toLowerCase()));
  const rankedAmbulances = ambulances
    .map((unit) => {
      const equipmentMatches = unit.equipment.filter((item) => needs.has(item)).length;
      const advancedLifeSupportBonus = unit.crew === "ALS" && ["critical", "high"].includes(incident.acuity) ? 8 : 0;
      const statusPenalty = unit.status === "Available" ? 0 : 6;
      return { ...unit, score: 100 - unit.etaMinutes * 4 + equipmentMatches * 7 + advancedLifeSupportBonus - statusPenalty };
    })
    .sort((a, b) => b.score - a.score);

  const rankedHospitals = hospitals
    .map((hospital) => {
      const specialtyMatches = hospital.specialties.filter((item) => needs.has(item)).length;
      const capacityBonus = Math.min(hospital.beds, 10);
      return { ...hospital, score: 100 - hospital.etaMinutes * 3 + specialtyMatches * 10 + capacityBonus };
    })
    .sort((a, b) => b.score - a.score);

  const ambulance = rankedAmbulances[0];
  const hospital = rankedHospitals[0];
  const priority = acuityWeight[incident.acuity] || 2;

  return {
    incidentId: incident.incidentId,
    ambulance,
    hospital,
    priority,
    estimatedArrivalMinutes: ambulance.etaMinutes,
    deterministicReason: `${ambulance.id} ranks highest for ETA, crew capability and equipment. ${hospital.name} ranks highest for travel time, capacity and required specialties.`
  };
}

export function validateIncident(input) {
  const incident = {
    incidentId: String(input.incidentId || `INC-${Date.now().toString().slice(-6)}`).slice(0, 32),
    location: String(input.location || "").trim().slice(0, 180),
    summary: String(input.summary || "").trim().slice(0, 600),
    acuity: String(input.acuity || "medium").toLowerCase(),
    needs: Array.isArray(input.needs) ? input.needs.slice(0, 8).map((value) => String(value).slice(0, 40)) : []
  };

  if (!incident.location || !incident.summary) throw new Error("Location and incident summary are required.");
  if (!Object.hasOwn(acuityWeight, incident.acuity)) throw new Error("Acuity must be critical, high, medium or low.");
  return incident;
}
