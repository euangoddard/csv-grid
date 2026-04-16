import { useEffect, useRef, useState } from "preact/hooks";
import { type Format, formatFromFileName } from "./format";

export function DownloadSplitButton({
  fileName,
  onDownload,
}: {
  fileName: string | null;
  onDownload: (format: Format) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const primary: Format = fileName ? formatFromFileName(fileName) : "csv";
  const secondary: Format = primary === "csv" ? "tsv" : "csv";

  return (
    <div ref={ref} class="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          onDownload(primary);
          setOpen(false);
        }}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-l-md bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
      >
        Download as {primary.toUpperCase()}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        class="inline-flex items-center px-2 py-1.5 text-sm rounded-r-md bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500 transition-colors cursor-pointer"
        aria-label="More download options"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </svg>
      </button>
      {open && (
        <div class="absolute top-full left-0 mt-1 w-max rounded-md shadow-lg bg-white border border-gray-200 z-10">
          <button
            type="button"
            onClick={() => {
              onDownload(secondary);
              setOpen(false);
            }}
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Download as {secondary.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
