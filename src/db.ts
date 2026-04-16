import { type DBSchema, openDB } from "idb";

export type CellValue = string | number | boolean | null;

interface SessionRecord {
  id: "current";
  fileName: string | null;
  data: CellValue[][];
}

interface CsvGridDB extends DBSchema {
  session: {
    key: "current";
    value: SessionRecord;
  };
}

const dbPromise = openDB<CsvGridDB>("csv-grid", 1, {
  upgrade(db) {
    db.createObjectStore("session", { keyPath: "id" });
  },
});

export async function saveSession(
  data: CellValue[][],
  fileName: string | null,
): Promise<void> {
  const db = await dbPromise;
  await db.put("session", { id: "current", fileName, data });
}

export async function loadSession(): Promise<SessionRecord | undefined> {
  const db = await dbPromise;
  return db.get("session", "current");
}

export async function clearSession(): Promise<void> {
  const db = await dbPromise;
  await db.delete("session", "current");
}
