# Smart Ambulance MVP Architecture

## Runtime flow

1. A dispatcher enters an incident location, summary, acuity, and required capability.
2. The server validates and limits the submitted fields.
3. A deterministic engine ranks synthetic ambulances and hospitals by ETA, capability, specialty, and capacity.
4. The OpenAI Responses API explains the ranking using a strict JSON schema and produces a short verification checklist.
5. The dashboard displays the recommendation and requires explicit human confirmation.

## Safety boundary

- The MVP is operational decision support, not a medical device.
- It does not diagnose, prescribe treatment, contact emergency services, or dispatch real vehicles.
- Recommendations use synthetic fleet and hospital data.
- Deterministic ranking remains available if the AI call fails.
- A trained human must verify location, unit status, receiving capacity, and patient information.

## Production path

- Replace synthetic resources with authenticated CAD, AVL/GPS, traffic, and hospital-capacity adapters.
- Add role-based access, audit trails, encryption, consent, retention policies, and regional health-data compliance.
- Use idempotent dispatch commands with supervisor approval and a complete event log.
- Validate routing and clinical escalation logic with emergency-services partners before any real-world pilot.
