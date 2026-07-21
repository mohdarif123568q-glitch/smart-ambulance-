const form = document.querySelector("#incident-form");
const recommendation = document.querySelector("#recommendation");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#dispatch-dialog");
const reviewed = document.querySelector("#confirm-reviewed");
const finalConfirm = document.querySelector("#final-confirm");
const summary = form.querySelector('textarea[name="summary"]');
let pendingDispatch = null;

const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function setStep(step) {
  const order = ["intake", "verify", "confirm"];
  document.querySelectorAll(".form-progress li").forEach((item) => {
    const index = order.indexOf(item.dataset.step);
    item.classList.toggle("complete", index < order.indexOf(step));
    item.classList.toggle("active", item.dataset.step === step);
  });
}

function updateSummaryCount() {
  document.querySelector("#summary-count").textContent =
    `${summary.value.length} / 600 characters`;
}

summary.addEventListener("input", updateSummaryCount);
updateSummaryCount();

document
  .querySelector("#new-incident-shortcut")
  .addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector('input[name="location"]').focus();
  });

reviewed.addEventListener("change", () => {
  finalConfirm.disabled = !reviewed.checked;
});

dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "confirm" || !pendingDispatch) return;
  setStep("confirm");
  showToast(`${pendingDispatch.ambulance.id} confirmed in demonstration mode.`);
  toast.classList.add("success");
  setTimeout(() => toast.classList.remove("success"), 2800);
  pendingDispatch = null;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  const data = new FormData(form);
  button.disabled = true;
  button.textContent = "Analyzing incident…";
  setStep("verify");
  recommendation.classList.add("loading");
  recommendation.innerHTML =
    '<div class="recommendation-empty"><span>✦</span><div><strong>Ranking available resources</strong><p>Checking ETA, capabilities, capacity and required specialties…</p></div></div>';
  try {
    const response = await fetch("/api/dispatch/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-240721",
        location: data.get("location"),
        summary: data.get("summary"),
        acuity: data.get("acuity"),
        needs: [data.get("need")],
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Analysis failed");
    const { ranking, ai, aiStatus } = result;
    const reason = escapeHTML(
      ai?.dispatch_rationale || ranking.deterministicReason,
    );
    const checks = ai?.dispatcher_checks || [
      "Confirm caller location",
      "Verify unit radio status",
      "Confirm receiving capacity",
    ];
    pendingDispatch = ranking;
    recommendation.innerHTML = `
      <div class="recommendation-content">
        <div class="recommendation-score"><small>Recommended unit</small><strong>${escapeHTML(ranking.ambulance.id)}</strong><small>${ranking.estimatedArrivalMinutes} min ETA · ${aiStatus === "available" ? "AI supported" : "Rules fallback"}</small></div>
        <div class="recommendation-copy"><h3>${escapeHTML(ranking.ambulance.crew)} unit → ${escapeHTML(ranking.hospital.name)}</h3><p>${reason}</p><div class="checks">${checks.map((item) => `<span>✓ ${escapeHTML(item)}</span>`).join("")}</div></div>
        <button class="confirm-button" id="confirm-dispatch">Confirm dispatch</button>
      </div>`;
    document
      .querySelector("#confirm-dispatch")
      .addEventListener("click", () => {
        reviewed.checked = false;
        finalConfirm.disabled = true;
        document.querySelector("#confirmation-summary").innerHTML =
          `<strong>${escapeHTML(ranking.ambulance.id)} · ${escapeHTML(ranking.ambulance.crew)}</strong><br>${ranking.estimatedArrivalMinutes} min to incident · Destination: ${escapeHTML(ranking.hospital.name)}`;
        dialog.showModal();
      });
  } catch (error) {
    recommendation.innerHTML = `<div class="recommendation-empty"><span>!</span><div><strong>Unable to analyze</strong><p>${error.message}</p></div></div>`;
  } finally {
    recommendation.classList.remove("loading");
    button.disabled = false;
    button.innerHTML = "<span>✦</span> Analyze & recommend";
  }
});
