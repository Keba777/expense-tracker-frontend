const AM_CATEGORIES: Record<string, string> = {
  "Food & Dining":  "ምግብ እና ምሳ",
  "Transportation": "ትራንስፖርት",
  "Shopping":       "ግዢ",
  "Housing & Rent": "ቤት እና ኪራይ",
  "Healthcare":     "የጤና እንክብካቤ",
  "Entertainment":  "መዝናኛ",
  "Education":      "ትምህርት",
  "Utilities":      "አገልግሎቶች",
  "Travel":         "ጉዞ",
  "Personal Care":  "ግላዊ እንክብካቤ",
  "Subscriptions":  "ደንበኝነት",
  "Other Expense":  "ሌሎች ወጪዎች",
  "Salary":         "ደሞዝ",
  "Freelance":      "ነጻ ሥራ",
  "Investments":    "ኢንቨስትመንት",
  "Gifts":          "ስጦታዎች",
  "Other Income":   "ሌሎች ገቢዎች",
};

export function translateCategory(name: string, lang: string): string {
  return lang === "am" ? (AM_CATEGORIES[name] ?? name) : name;
}
