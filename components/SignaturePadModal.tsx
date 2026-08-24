"use client";

import { useRef, useState, useEffect } from "react";
import { saveUserSignatureAction } from "@/actions/auth";
import { PenLine, Upload, Eraser, CheckCircle2, AlertCircle, X, Loader2, Sparkles } from "lucide-react";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSaved: (path: string, previewUrl?: string) => void;
  currentSignaturePath?: string | null;
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSignatureSaved,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>("#0F2962");

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, penColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setError(null);

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please select a PNG or JPEG signature image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Signature file must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let dataUrl: string | null = null;

    if (activeTab === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setError("Please draw your official signature before saving.");
        return;
      }
      dataUrl = canvasRef.current.toDataURL("image/png");
    } else {
      if (!uploadedImage) {
        setError("Please select an image file.");
        return;
      }
      dataUrl = uploadedImage;
    }

    setIsLoading(true);
    setError(null);

    const res = await saveUserSignatureAction(dataUrl);
    setIsLoading(false);

    if (res.success && res.signaturePath) {
      onSignatureSaved(res.signaturePath, dataUrl);
      onClose();
    } else {
      setError(res.error || "Failed to save electronic signature.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-white/90 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F2962] border border-blue-200/80 flex items-center justify-center font-bold shadow-xs">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Institutional E-Signature</h2>
              <span className="text-xs text-slate-500 font-medium block">
                Official signature for document stamping & audit compliance
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200/90 flex items-center gap-2.5 text-xs font-bold text-red-900 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold shadow-inner">
          <button
            onClick={() => {
              setActiveTab("draw");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "draw"
                ? "bg-white text-[#0F2962] shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Draw on Screen</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("upload");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-[#0F2962] shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Draw Mode */}
        {activeTab === "draw" && (
          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/80 overflow-hidden h-48 cursor-crosshair shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs font-medium space-y-1">
                  <PenLine className="w-6 h-6 opacity-40 animate-pulse" />
                  <span>Sign your name here with mouse, trackpad, or finger</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Ink Color:</span>
                <button
                  type="button"
                  onClick={() => setPenColor("#0F2962")}
                  className={`w-5 h-5 rounded-full bg-[#0F2962] border-2 transition ${penColor === "#0F2962" ? "border-amber-400 scale-110" : "border-white"}`}
                  title="FAITH Navy"
                />
                <button
                  type="button"
                  onClick={() => setPenColor("#000000")}
                  className={`w-5 h-5 rounded-full bg-black border-2 transition ${penColor === "#000000" ? "border-amber-400 scale-110" : "border-white"}`}
                  title="Black"
                />
              </div>

              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 font-bold transition cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-7 text-center bg-slate-50/80 hover:bg-slate-100/80 transition-all shadow-inner">
              {uploadedImage ? (
                <div className="space-y-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Signature Preview"
                    className="max-h-24 mx-auto object-contain border border-slate-200 bg-white p-2 rounded-xl shadow-xs"
                  />
                  <label className="inline-block px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition shadow-xs">
                    Choose Another File
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="block text-xs font-bold text-slate-800">
                    Upload official signature file
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Transparent PNG recommended (Max 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || (activeTab === "draw" && !hasDrawn) || (activeTab === "upload" && !uploadedImage)}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Save E-Signature</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
