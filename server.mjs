import "./src/load-env.mjs";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createAiRecommendation } from "./src/openai-dispatch.mjs";
import { rankDispatch, validateIncident } from "./src/dispatch-engine.mjs";
import {
  getIntegrationStatus,
  getOperationalSnapshot,
} from "./src/data-providers.mjs";
import { getAuditEvents, recordAuditEvent } from "./src/audit-store.mjs";

const root = fileURLToPath(new URL("./public", import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(
      request.url,
      `http://${request.headers.host || "localhost"}`,
    );
    if (request.method === "GET" && url.pathname === "/api/health") {
      return send(response, 200, {
        ok: true,
        aiConfigured: Boolean(process.env.OPENAI_API_KEY),
        integrations: getIntegrationStatus(),
        service: "smart-ambulance-mvp",
      });
    }

    if (request.method === "GET" && url.pathname === "/api/audit-events") {
      return send(response, 200, {
        events: getAuditEvents(url.searchParams.get("limit")),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/dispatch/analyze") {
      const incident = validateIncident(await readJson(request));
      const snapshot = await getOperationalSnapshot(incident);
      const ranking = rankDispatch(incident, snapshot);
      let ai = null;
      let aiStatus = "available";
      try {
        ai = await createAiRecommendation(incident, ranking);
        if (!ai) aiStatus = "not-configured";
      } catch (error) {
        aiStatus = "fallback";
        console.error("OpenAI recommendation failed:", error?.message || error);
      }
      const auditEvent = recordAuditEvent("dispatch.analysis.completed", {
        incidentId: incident.incidentId,
        dataSource: snapshot.source,
        ambulanceId: ranking.ambulance.id,
        hospitalId: ranking.hospital.id,
        aiStatus,
      });
      return send(response, 200, {
        incident,
        ranking,
        ai,
        aiStatus,
        dataMode: snapshot.mode,
        dataSource: snapshot.source,
        auditEventId: auditEvent.id,
        requiresHumanConfirmation: true,
        generatedAt: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/dispatch/confirm") {
      const payload = await readJson(request);
      const incidentId = String(payload.incidentId || "").slice(0, 32);
      const ambulanceId = String(payload.ambulanceId || "").slice(0, 32);
      const hospitalId = String(payload.hospitalId || "").slice(0, 32);
      if (
        !incidentId ||
        !ambulanceId ||
        !hospitalId ||
        payload.reviewed !== true
      ) {
        return send(response, 400, {
          error:
            "Reviewed incident, ambulance and hospital details are required.",
        });
      }
      const auditEvent = recordAuditEvent("dispatch.intent.confirmed", {
        incidentId,
        ambulanceId,
        hospitalId,
        actor: "demo-dispatcher",
        mode: "dry-run",
      });
      return send(response, 202, {
        accepted: true,
        mode: "dry-run",
        liveDispatchPerformed: false,
        auditEventId: auditEvent.id,
        message:
          "Dispatch intent recorded. No emergency service was contacted.",
      });
    }

    if (request.method !== "GET")
      return send(response, 405, { error: "Method not allowed" });
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = join(root, safePath);
    if (!filePath.startsWith(root))
      return send(response, 403, { error: "Forbidden" });
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not found");
    response.writeHead(200, {
      "content-type": mime[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    response.end(await readFile(filePath));
  } catch (error) {
    const status =
      error?.code === "ENOENT" || error?.message === "Not found" ? 404 : 400;
    send(response, status, {
      error: status === 404 ? "Not found" : error?.message || "Request failed",
    });
  }
});

server.listen(port, () =>
  console.log(`Smart Ambulance MVP running at http://localhost:${port}`),
);
