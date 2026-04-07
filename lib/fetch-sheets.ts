import Papa from "papaparse";

export type SheetDataRow = Record<string, string>;

export async function fetchSheetsData(): Promise<SheetDataRow[]> {
  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1Vj_1yrNuKx8XA32G2ghCvgzwhRJkpHmYRn6SbQKXGXI/export?format=csv";

  try {
    const response = await fetch(SHEET_URL, {
      cache: "no-store", // We might want to revalidate, but no-store ensures fresh data for now
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<SheetDataRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("PapaParse errors:", results.errors);
          }
          resolve(results.data as SheetDataRow[]);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error fetching Google Sheet CSV:", error);
    return [];
  }
}
