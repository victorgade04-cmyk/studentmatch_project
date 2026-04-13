"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PACKAGES, PackageId } from "@/lib/packages";

interface Doc {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

interface Props {
  userId: string;
  pkgId: PackageId;
}

export default function DocumentsSection({ userId, pkgId }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pkg = PACKAGES[pkgId];
  const maxUploads = pkg.maxUploads;
  const atLimit = maxUploads !== null && docs.length >= maxUploads;

  async function loadDocs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("student_documents")
      .select("id, file_name, file_path, file_size, uploaded_at")
      .eq("student_id", userId)
      .order("uploaded_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadDocs();
  }, [userId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.type !== "application/pdf") {
      setError("Kun PDF-filer er tilladt.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Filen er for stor. Maks. 5 MB er tilladt.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (atLimit) {
      setError("Du har nået din uploadgrænse.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const supabase = createClient();

    // Sanitise filename, prefix with timestamp to avoid collisions
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${Date.now()}_${safeName}`;

    try {
      const { error: storageErr } = await supabase.storage
        .from("student-documents")
        .upload(filePath, file, { contentType: "application/pdf" });

      if (storageErr) throw new Error(storageErr.message);

      const { error: dbErr } = await supabase.from("student_documents").insert({
        student_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      });

      if (dbErr) {
        // Clean up orphaned storage object
        await supabase.storage.from("student-documents").remove([filePath]);
        throw new Error(dbErr.message);
      }

      await loadDocs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(doc: Doc) {
    setError(null);
    setDeletingId(doc.id);
    const supabase = createClient();

    // Remove from storage (best-effort — proceed even if file is already gone)
    await supabase.storage.from("student-documents").remove([doc.file_path]);

    const { error: dbErr } = await supabase
      .from("student_documents")
      .delete()
      .eq("id", doc.id);

    if (dbErr) {
      setError(dbErr.message);
      setDeletingId(null);
      return;
    }

    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setDeletingId(null);
  }

  function formatSize(bytes: number) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  if (loading) {
    return (
      <div className="mt-8 pt-8 border-t border-gray-100">
        <p className="text-gray-400 text-sm">Indlæser dokumenter…</p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900">Dokumenter</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {maxUploads === null
              ? `${docs.length} dokument${docs.length !== 1 ? "er" : ""} uploadet`
              : `${docs.length} / ${maxUploads} dokument${maxUploads !== 1 ? "er" : ""}`}
          </p>
        </div>

        {atLimit ? (
          <Link
            href="/dashboard/student/package"
            className="text-xs font-semibold text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Opgrader for flere
          </Link>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-60 transition-colors px-4 py-2 rounded-lg"
            >
              {uploading ? "Uploader…" : "Upload PDF"}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}

      {docs.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center">
          <p className="text-sm text-gray-400">
            {atLimit
              ? "Du har nået din uploadgrænse."
              : "Ingen dokumenter uploadet endnu. Upload dit CV som PDF."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">PDF</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-gray-400">{formatSize(doc.file_size)}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deletingId === doc.id}
                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {deletingId === doc.id ? "Sletter…" : "Slet"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Kun PDF-filer · Maks. 5 MB per fil · Dine dokumenter er kun synlige for virksomheder og admins.
      </p>
    </div>
  );
}
