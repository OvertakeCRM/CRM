"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import { uploadPhoto, deletePhoto } from "@/lib/actions/prospects";
import { photoUrl } from "@/lib/photoUrl";
import type { Photo } from "@/lib/database.types";

export default function PhotoUploader({ prospectId, photos }: { prospectId: string; photos: Photo[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", files[0]);
    startTransition(async () => {
      try {
        await uploadPhoto(prospectId, formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <Image src={photoUrl(photo.storage_path)} alt="" fill sizes="200px" className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => startTransition(() => deletePhoto(photo.id, prospectId, photo.storage_path))}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Delete photo"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 disabled:opacity-50 dark:border-slate-700 dark:text-slate-500"
        >
          <Camera size={22} />
          <span className="text-xs font-medium">{isPending ? "Uploading…" : "Add"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
