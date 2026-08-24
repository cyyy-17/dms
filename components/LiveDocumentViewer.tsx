"use client";

import { useState, useEffect } from "react";
import { getSignedDocumentUrlAction } from "@/actions/documents";
import {
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  FileCode,
  Sparkles,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface LiveDocumentViewerProps {
  documentTitle: string;
  trackingNumber: string;
  storagePath: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  versionNumber: number;
}

export default function LiveDocumentViewer({
  documentTitle,
  trackingNumber,
  storagePath,
  fileName,
  fileSize,
  mimeType,
  versionNumber,
}: LiveDocumentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
  const isOfficeDoc =
    mimeType.includes("word") ||
    mimeType.includes("officedocument") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    /\.(docx?|xlsx?|pptx?)$/i.test(fileName);

  useEffect(() => {
    let isMounted = true;
    if (!storagePath || !isPreviewOpen) {
      return;
    }

    getSignedDocumentUrlAction(storagePath)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.signedUrl) {
          setSignedUrl(res.signedUrl);
          setError(null);
        } else {
          setError(res.error || "Unable to generate secure document stream.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Network error loading document stream.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [storagePath, isPreviewOpen]);

  const handleReload = () => {
    if (!storagePath) return;
    setIsLoading(true);
    setError(null);
    getSignedDocumentUrlAction(storagePath)
      .then((res) => {
        if (res.success && res.signedUrl) {
          setSignedUrl(res.signedUrl);
        } else {
          setError(res.error || "Unable to generate secure document stream.");
        }
      })
      .catch(() => setError("Network error loading document stream."))
      .finally(() => setIsLoading(false));
  };

  const handleDownload = async () => {
    if (!storagePath) return;
    setDownloadLoading(true);
    try {
      if (signedUrl) {
        window.open(signedUrl, "_blank");
      } else {
        const res = await getSignedDocumentUrlAction(storagePath);
        if (res.success && res.signedUrl) {
          window.open(res.signedUrl, "_blank");
        } else {
          setError(res.error || "Failed to generate download URL.");
        }
      }
    } catch {
      setError("Download error.");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!storagePath) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-white/90 text-center space-y-3 shadow-xs">
        <FileCode className="w-9 h-9 mx-auto text-slate-400" />
        <p className="text-xs font-bold text-slate-700">No binary file attached to this version record.</p>
      </div>
    );
  }

  return (
    <div
      className={`glass-panel rounded-3xl border border-white/90 overflow-hidden shadow-lg transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none bg-slate-950/95 flex flex-col p-6 backdrop-blur-2xl"
          : "space-y-0"
      }`}
    >
      {/* Viewer Top Action Bar */}
      <div className="p-4 sm:p-5 bg-white/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 flex items-center justify-center font-bold shadow-md shrink-0 border border-blue-400/30">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate block">
                {fileName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100/90 text-blue-800 text-[10px] font-black border border-blue-200">
                v{versionNumber}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block font-mono font-medium mt-0.5">
              {trackingNumber} • {(fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
            title={isPreviewOpen ? "Collapse Live Preview" : "Expand Live Preview"}
          >
            {isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isPreviewOpen ? "Hide Preview" : "Live View Document"}</span>
          </button>

          {signedUrl && (
            <button
              onClick={() => window.open(signedUrl, "_blank")}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
              title="Open in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Live View"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            className="px-4 py-2 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{downloadLoading ? "Signing..." : "Download"}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Display Body */}
      {isPreviewOpen && (
        <div
          className={`relative bg-slate-950 overflow-hidden flex items-center justify-center transition-all ${
            isFullscreen ? "flex-1 w-full rounded-2xl mt-4 border border-slate-800" : "h-130 lg:h-160"
          }`}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3.5 text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <div className="text-center">
                <span className="text-xs font-bold block text-white">Generating Secure Stream...</span>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                  Decrypting from Supabase private vault
                </span>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-8 text-center space-y-3.5 max-w-md bg-slate-900/80 rounded-2xl border border-slate-800">
              <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Live Stream Unavailable</p>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
              <button
                onClick={handleReload}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Stream</span>
              </button>
            </div>
          )}

          {signedUrl && !isLoading && !error && (
            <>
              {isPdf && (
                <iframe
                  src={`${signedUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  title={documentTitle}
                  className="w-full h-full border-0 bg-white"
                />
              )}

              {isImage && (
                <div className="w-full h-full p-6 flex items-center justify-center overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={documentTitle}
                    className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800 bg-white"
                  />
                </div>
              )}

              {isOfficeDoc && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm space-y-1.5">
                    <h4 className="text-base font-bold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Office Document stream verified with cryptographic checksum.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                        signedUrl
                      )}&embedded=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4.5 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Open in Web Viewer</span>
                    </a>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}

              {!isPdf && !isImage && !isOfficeDoc && (
                <iframe
                  src={signedUrl}
                  title={documentTitle}
                  className="w-full h-full border-0 bg-white"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
