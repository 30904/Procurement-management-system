export function ratingTone(rating) {
  const r = String(rating || "").toLowerCase();
  if (r === "excellent") return "excellent";
  if (r === "good") return "good";
  if (r === "average") return "average";
  if (r === "needs improvement") return "poor";
  if (r === "blacklisted") return "blacklisted";
  return "neutral";
}

export function scoreTone(score) {
  const n = Number(score);
  if (n >= 90) return "excellent";
  if (n >= 80) return "good";
  if (n >= 70) return "average";
  return "poor";
}

export function riskTone(level) {
  const l = String(level || "").toLowerCase();
  if (l === "high") return "high";
  if (l === "medium") return "medium";
  return "low";
}

export function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}
