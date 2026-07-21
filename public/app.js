const form = document.querySelector("#incident-form");
const recommendation = document.querySelector("#recommendation");
const toast = document.querySelector("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  const data = new FormData(form);
  button.disabled = true;
  button.textContent = "Analyzing incident…";
  recommendation.innerHTML = '<div class="recommendation-empty"><span>✦</span><div><strong>Ranking available resources</strong><p>Checking ETA, capabilities, capacity and required specialties…</p></div></div>';
  try {
    const response = await fetch("/api/dispatch/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-240721",
        location: data.get("location"),
        summary: data.get("summary"),
        acuity: data.get("acuity"),
        needs: [data.get("need")]
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Analysis failed");
    const { ranking, ai, aiStatus } = result;
    const reason = ai?.dispatch_rationale || ranking.deterministicReason;
    const checks = ai?.dispatcher_checks || ["Confirm caller location", "Verify unit radio status", "Confirm receiving capacity"];
    recommendation.innerHTML = `
      <div class="recommendation-content">
        <div class="recommendation-score"><small>Recommended unit</small><strong>${ranking.ambulance.id}</strong><small>${ranking.estimatedArrivalMinutes} min ETA · ${aiStatus === "available" ? "AI supported" : "Rules fallback"}</small></div>
        <div class="recommendation-copy"><h3>${ranking.ambulance.crew} unit → ${ranking.hospital.name}</h3><p>${reason}</p><div class="checks">${checks.map((item) => `<span>✓ ${item}</span>`).join("")}</div></div>
        <button class="confirm-button" id="confirm-dispatch">Confirm dispatch</button>
      </div>`;
    document.querySelector("#confirm-dispatch").addEventListener("click", () => {
      showToast(`${ranking.ambulance.id} marked for dispatcher confirmation — demo only.`);
    });
  } catch (error) {
    recommendation.innerHTML = `<div class="recommendation-empty"><span>!</span><div><strong>Unable to analyze</strong><p>${error.message}</p></div></div>`;
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>✦</span> Analyze & recommend";
  }
});
