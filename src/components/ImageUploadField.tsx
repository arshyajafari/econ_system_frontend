import { useEffect, useRef, useState } from "react";

type ImageUploadFieldProps = { label: string; value?: string | null; file: File | null | undefined; onFileChange: (file: File | null) => void; disabled?: boolean; accept?: string; hint?: string; };
function formatFileSize(bytes: number): string { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export function ImageUploadField({ label, value, file, onFileChange, disabled = false, accept = "image/jpeg,image/png,image/webp", hint = "JPG، PNG یا WEBP · حداکثر ۵ مگابایت" }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const preview = file ? filePreview : value ?? null;

  function selectFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) return;
    if (nextFile.size > 5 * 1024 * 1024) return;
    onFileChange(nextFile);
  }

  return <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
    <div onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) selectFile(event.dataTransfer.files?.[0] ?? null); }} className={`overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 transition ${dragging ? "border-gray-700 bg-gray-100" : "border-gray-300 hover:border-gray-400"}`}>
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="flex w-full items-center gap-4 p-4 text-right disabled:cursor-not-allowed disabled:opacity-60">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">{preview ? <img src={preview} alt="پیش‌نمایش" className="h-full w-full object-contain" /> : <span className="text-2xl" aria-hidden="true">📷</span>}</div>
        <div className="min-w-0 flex-1"><div className="font-semibold text-gray-800">{file ? "تصویر جدید انتخاب شد" : preview ? "تغییر تصویر" : "انتخاب تصویر"}</div><div className="mt-1 text-xs leading-5 text-gray-500">{hint}</div>{file ? <div className="mt-2 truncate text-xs font-medium text-gray-700">{file.name} · {formatFileSize(file.size)}</div> : preview ? <div className="mt-2 text-xs text-gray-500">تصویر فعلی حفظ می‌شود مگر تصویر جدید انتخاب کنید.</div> : null}</div>
        <span className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white">انتخاب فایل</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} disabled={disabled} onChange={(event) => { selectFile(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} className="hidden" />
      <div className="border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">فایل را اینجا رها کنید یا روی «انتخاب فایل» بزنید.</div>
    </div>
  </div>;
}
