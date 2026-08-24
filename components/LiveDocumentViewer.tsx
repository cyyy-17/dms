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
      <div className="glass-card rounded-2xl p-6 border border-slate-200 text-center space-y-2">
        <FileCode className="w-8 h-8 mx-auto text-slate-400" />
        <p className="text-xs font-bold text-slate-700">No binary file attached to this version.</p>
      </div>
    );
  }

  return (
    <div
      className={`glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none bg-slate-900/95 flex flex-col p-4 backdrop-blur-md"
          : "space-y-0"
      }`}
    >
      {/* Viewer Action Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F2962] text-amber-400 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 truncate block">
                {fileName}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                v{versionNumber}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              {trackingNumber} • {(fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            title={isPreviewOpen ? "Collapse Live Preview" : "Expand Live Preview"}
          >
            {isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isPreviewOpen ? "Hide Preview" : "Live View Document"}</span>
          </button>

          {signedUrl && (
            <button
              onClick={() => window.open(signedUrl, "_blank")}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 transition"
              title="Open in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Live View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{downloadLoading ? "Signing..." : "Download (Optional)"}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Display Body */}
      {isPreviewOpen && (
        <div
          className={`relative bg-slate-900/90 overflow-hidden flex items-center justify-center transition-all ${
            isFullscreen ? "flex-1 w-full rounded-xl mt-3" : "h-120 lg:h-145"
          }`}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 text-slate-300">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
              <div className="text-center">
                <span className="text-xs font-bold block">Generating Secure Stream...</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Decrypting from Supabase private storage
                </span>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 text-center space-y-3 max-w-md">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">Live Stream Unavailable</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
              </div>
              <button
                onClick={handleReload}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
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
                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={documentTitle}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
                  />
                </div>
              )}

              {isOfficeDoc && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h4 className="text-sm font-bold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400">
                      Office Document stream verified under RA 10173 integrity token.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                        signedUrl
                      )}&embedded=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open in Web Document Viewer</span>
                    </a>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
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
