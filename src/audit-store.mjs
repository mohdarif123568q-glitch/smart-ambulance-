const events = [];
const maximumEvents = 500;

export function recordAuditEvent(type, details) {
  const event = {
    id: `EVT-${crypto.randomUUID()}`,
    type,
    occurredAt: new Date().toISOString(),
    details,
  };
  events.unshift(event);
  if (events.length > maximumEvents) events.length = maximumEvents;
  return event;
}

export function getAuditEvents(limit = 50) {
  return events.slice(0, Math.min(Math.max(Number(limit) || 50, 1), 100));
}
