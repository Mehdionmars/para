"use client";

import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function ImagePicker({
  imageId,
  imageUrl,
  onChange,
  label = "Image",
}: {
  imageId?: number;
  imageUrl?: string;
  onChange: (id: number | undefined, url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [alt, setAlt] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);

  // Load the current image's alt text whenever it points at a real Media doc.
  useEffect(() => {
    if (!imageId) {
      setAlt("");
      return;
    }
    let cancelled = false;
    fetch(`/api/dashboard-media?id=${imageId}`)
      .then((res) => (res.ok ? res.json() : { alt: "" }))
      .then((data) => {
        if (!cancelled) setAlt(data.alt || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/dashboard-media", { body: form, method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Échec de l'upload.");
      const data = await res.json();
      onChange(data.id, data.url);
      setAlt(data.alt || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
    }
  }

  async function saveAlt(next: string) {
    setAlt(next);
    if (!imageId) return;
    setSavingAlt(true);
    try {
      await fetch("/api/dashboard-media", { body: JSON.stringify({ id: imageId, alt: next }), method: "PATCH" });
    } finally {
      setSavingAlt(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-300">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <label className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : imageUrl ? "Remplacer" : "Téléverser"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {imageUrl && (
          <button type="button" onClick={() => onChange(undefined, "")} className="text-xs text-gray-400 hover:text-red-600">
            Retirer
          </button>
        )}
      </div>
      {imageUrl && imageId && (
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={(e) => saveAlt(e.target.value)}
          placeholder="Texte alternatif (accessibilité, SEO)"
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-violet-400"
        />
      )}
      {savingAlt && <span className="text-[11px] text-gray-400">Enregistrement du texte alternatif...</span>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
