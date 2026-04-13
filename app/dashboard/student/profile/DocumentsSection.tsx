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
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">Dokumenter</label>
        </div>
        <p className="text-xs text-gray-400">Indlæser…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Label row — matches surrounding field label style */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">Dokumenter</label>
        <span className="text-xs text-gray-400">
          {maxUploads === null
            ? `${docs.length} uploadet`
            : `${docs.length} / ${maxUploads}`}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          {error}
        </p>
      )}

      {/* Uploaded files */}
      {docs.length > 0 && (
        <ul className="space-y-2 mb-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5"
            >
              <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-500">PDF</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-400">{formatSize(doc.file_size)}</p>
              </div>
              <button
                type="button"
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

      {/* Upload button or upgrade prompt */}
      {atLimit ? (
        <Link
          href="/dashboard/student/package"
          className="block text-center border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Opgrader for flere uploads
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-colors text-left"
          >
            {uploading ? "Uploader…" : docs.length === 0 ? "Upload PDF (maks. 5 MB)" : "+ Upload endnu en PDF"}
          </button>
        </>
      )}

      <p className="text-xs text-gray-400 mt-1.5">
        Kun PDF · Maks. 5 MB · Kun synlig for virksomheder og admins
      </p>
    </div>
  );
}
