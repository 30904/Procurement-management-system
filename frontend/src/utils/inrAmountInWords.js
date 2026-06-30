const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ""}`.trim();
}

function sectionToWords(n, label) {
  if (!n) return "";
  if (n < 100) return `${twoDigits(n)} ${label}`;
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${ONES[h]} Hundred${r ? ` ${twoDigits(r)}` : ""} ${label}`.trim();
}

function integerToWords(n) {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;
  const parts = [];
  if (crore) parts.push(sectionToWords(crore, "Crore"));
  if (lakh) parts.push(sectionToWords(lakh, "Lakh"));
  if (thousand) parts.push(sectionToWords(thousand, "Thousand"));
  if (hundred) parts.push(sectionToWords(hundred, ""));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** @returns e.g. "INR One Lakh Eighty Thousand One Hundred Eighty Six Only" */
export function inrAmountInWords(amount) {
  const n = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(n)) return "INR Zero Only";
  const rupees = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - rupees) * 100);
  let words = `INR ${integerToWords(rupees)}`;
  if (paise > 0) {
    words += ` and ${integerToWords(paise)} Paise`;
  }
  return `${words} Only`;
}
