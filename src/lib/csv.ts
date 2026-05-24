import Papa from "papaparse";
import type { RawRow } from "@/types";

export function parseCsv(csvText: string): RawRow[] {
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<RawRow>(cleanText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
    transform: (value) => (typeof value === "string" ? value.replace(/^\uFEFF/, "").trim() : value),
  });

  if (parsed.errors.length > 0) {
    console.warn("CSV parse warnings", parsed.errors);
  }

  return parsed.data.filter((row) =>
    Object.values(row).some((value) => typeof value === "string" && value.trim().length > 0),
  );
}
