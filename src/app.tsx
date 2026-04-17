import Papa from "papaparse";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { DownloadSplitButton } from "./DownloadSplitButton";
import { type CellValue, clearSession, loadSession, saveSession } from "./db";
import { delimiterFor, type Format, formatFromFileName } from "./format";

interface Status {
  message: string;
  isError: boolean;
}

// Debounce helper — returns a function that delays invoking `fn` until after
// `delay` ms have elapsed since the last call.
function debounce<T extends () => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return (() => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  }) as T;
}

const EMPTY_GRID = { rows: 50, cols: 26 } as const;

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<DataGridXL | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef<() => void>(() => {});

  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [restoring, setRestoring] = useState(true);

  const showStatus = useCallback((message: string, isError = false) => {
    if (statusTimerRef.current !== null) clearTimeout(statusTimerRef.current);
    setStatus({ message, isError });
    statusTimerRef.current = setTimeout(() => setStatus(null), 3000);
  }, []);

  useEffect(() => {
    persistRef.current = debounce(() => {
      const data = gridRef.current?.getData();
      if (!data) return;
      void saveSession(data, fileName);
    }, 500);
  }, [fileName]);

  // Load any saved session, then initialise the grid with that data.
  useEffect(() => {
    if (!containerRef.current || gridRef.current) return;

    loadSession().then((session) => {
      if (!containerRef.current || gridRef.current) return;

      const emptyData = window.DataGridXL.createEmptyData(
        EMPTY_GRID.rows,
        EMPTY_GRID.cols,
      );
      const grid = new window.DataGridXL("datagrid-container", {
        data: emptyData,
      });
      gridRef.current = grid;

      // DataGridXL doesn't invoke specific-event listeners registered via .on(),
      // but the "any" wildcard does fire — filter by event name as a workaround.
      grid.events.on("any", (_data: unknown, eventName: unknown) => {
        if (eventName === "cellvaluechange") persistRef.current();
      });

      grid.events.on("ready", () => {
        if (session) {
          grid.setData(session.data);
          setFileName(session.fileName);
          showStatus("Session restored");
        }
        setRestoring(false);
      });
    });
  }, [showStatus]);

  const handleFileOpen = useCallback(
    (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      Papa.parse<CellValue[]>(file, {
        skipEmptyLines: true,
        delimiter: delimiterFor(formatFromFileName(file.name)),
        complete(results) {
          const data = results.data;
          if (!data.length) {
            showStatus("The file appears to be empty.", true);
            return;
          }
          gridRef.current?.setData(data);
          setFileName(file.name);
          void saveSession(data, file.name);
          showStatus(`Loaded ${file.name}`);
        },
        error(err) {
          showStatus(`Parse error: ${err.message}`, true);
        },
      });

      input.value = "";
    },
    [showStatus],
  );

  const handleDownload = useCallback(
    (format: Format) => {
      const data = gridRef.current?.getData();
      if (!data) return;

      let lastNonEmpty = data.length - 1;
      while (
        lastNonEmpty > 0 &&
        data[lastNonEmpty].every((c) => c === "" || c == null)
      ) {
        lastNonEmpty--;
      }
      const trimmed = data.slice(0, lastNonEmpty + 1);

      const mimeType =
        format === "tsv" ? "text/tab-separated-values" : "text/csv";
      const content = Papa.unparse(trimmed, {
        delimiter: delimiterFor(format),
      });
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = (fileName ?? "export").replace(/\.(csv|tsv)$/i, "");
      a.download = `${baseName}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus(`Downloaded ${a.download}`);
    },
    [fileName, showStatus],
  );

  const handleNew = useCallback(() => {
    const emptyData = window.DataGridXL.createEmptyData(
      EMPTY_GRID.rows,
      EMPTY_GRID.cols,
    );
    gridRef.current?.setData(emptyData);
    setFileName(null);
    void clearSession();
    showStatus("New sheet created");
  }, [showStatus]);

  return (
    <div class="flex flex-col h-screen">
      <header class="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <span class="font-semibold text-gray-800 mr-2 select-none">
          CSV Grid
        </span>

        <button
          type="button"
          onClick={handleNew}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-green-600 bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
        >
          New
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
        >
          Open CSV / TSV…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          class="hidden"
          onChange={handleFileOpen}
        />

        <DownloadSplitButton fileName={fileName} onDownload={handleDownload} />

        {fileName && (
          <span
            class="ml-2 text-sm text-gray-500 truncate max-w-xs"
            title={fileName}
          >
            {fileName}
          </span>
        )}

        {restoring ? (
          <span class="ml-auto text-sm text-gray-400">Restoring…</span>
        ) : (
          status && (
            <span
              class={`ml-auto text-sm px-3 py-1 rounded-md ${
                status.isError
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {status.message}
            </span>
          )
        )}
      </header>

      <div class="flex-1 min-h-0">
        <div ref={containerRef} id="datagrid-container" class="w-full h-full" />
      </div>
    </div>
  );
}
