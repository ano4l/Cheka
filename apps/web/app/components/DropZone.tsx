"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  accept?: string;
  disabled?: boolean;
}

const acceptDefault = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DropZone({ onFile, selectedFile, onClear, accept = acceptDefault, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div className="space-y-1.5">
      <p className="label">Document</p>
      <label
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          isDragging
            ? "border-accent bg-accent/5"
            : selectedFile
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-line bg-canvas hover:border-slate-300 hover:bg-white"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isDragging) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
          ref={inputRef}
          type="file"
        />

        {selectedFile ? (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l5 5 9-10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{selectedFile.name}</p>
              <p className="text-xs text-muted">{formatBytes(selectedFile.size)} · ready to analyse</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost px-2.5 py-1 text-xs"
                onClick={(event) => {
                  event.preventDefault();
                  inputRef.current?.click();
                }}
              >
                Replace
              </button>
              {onClear ? (
                <button
                  type="button"
                  className="btn-ghost px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                  onClick={(event) => {
                    event.preventDefault();
                    onClear();
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-muted transition group-hover:bg-accent/10 group-hover:text-accent">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Drop a contract or click to browse</p>
              <p className="text-xs text-muted">PDF, DOCX, PNG/JPG · up to 8 MB</p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}
