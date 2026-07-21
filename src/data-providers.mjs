import {
  ambulances as demoAmbulances,
  hospitals as demoHospitals,
} from "./dispatch-engine.mjs";

const timeoutMs = Number(process.env.PARTNER_API_TIMEOUT_MS || 2500);

function requireArray(value, name) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} provider returned no usable records.`);
  }
  return value;
}

async function fetchPartnerJson(name, url, token, params = {}) {
  if (!url) throw new Error(`${name} endpoint is not configured.`);
  const endpoint = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value) endpoint.searchParams.set(key, String(value));
  }

  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok)
    throw new Error(`${name} provider returned HTTP ${response.status}.`);
  return response.json();
}

export async function getOperationalSnapshot(incident) {
  const mode = process.env.DATA_MODE === "partner" ? "partner" : "demo";
  if (mode === "demo") {
    return {
      mode,
      source: "synthetic-fixtures",
      ambulances: demoAmbulances,
      hospitals: demoHospitals,
      traffic: { status: "simulated", updatedAt: new Date().toISOString() },
    };
  }

  const [ambulancePayload, hospitalPayload, trafficPayload] = await Promise.all(
    [
      fetchPartnerJson(
        "Ambulance GPS",
        process.env.AMBULANCE_API_URL,
        process.env.AMBULANCE_API_TOKEN,
        { location: incident.location, needs: incident.needs.join(",") },
      ),
      fetchPartnerJson(
        "Hospital capacity",
        process.env.HOSPITAL_API_URL,
        process.env.HOSPITAL_API_TOKEN,
        { location: incident.location, needs: incident.needs.join(",") },
      ),
      process.env.TRAFFIC_API_URL
        ? fetchPartnerJson(
            "Traffic",
            process.env.TRAFFIC_API_URL,
            process.env.TRAFFIC_API_TOKEN,
            { location: incident.location },
          )
        : Promise.resolve({ status: "not-configured" }),
    ],
  );

  return {
    mode,
    source: "authorized-partner-apis",
    ambulances: requireArray(ambulancePayload.ambulances, "Ambulance GPS"),
    hospitals: requireArray(hospitalPayload.hospitals, "Hospital capacity"),
    traffic: trafficPayload,
  };
}

export function getIntegrationStatus() {
  const partnerMode = process.env.DATA_MODE === "partner";
  return {
    dataMode: partnerMode ? "partner" : "demo",
    ambulanceGps: partnerMode && Boolean(process.env.AMBULANCE_API_URL),
    hospitalCapacity: partnerMode && Boolean(process.env.HOSPITAL_API_URL),
    traffic: partnerMode && Boolean(process.env.TRAFFIC_API_URL),
    liveDispatchEnabled: false,
    safetyBoundary:
      "Dispatch confirmation creates an audited dry-run intent only.",
  };
}
