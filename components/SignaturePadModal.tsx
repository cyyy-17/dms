"use client";

import { useRef, useState, useEffect } from "react";
import { saveUserSignatureAction } from "@/actions/auth";
import { PenLine, Upload, Eraser, CheckCircle2, AlertCircle, X } from "lucide-react";

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

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle high DPI
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.strokeStyle = "#0F2962";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Drawing Handlers
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
        setError("Please draw your signature before saving.");
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Institutional E-Signature Setup</h2>
              <span className="text-[11px] text-slate-400">
                Official signature used for document approvals & audit stamping
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("draw");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "draw"
                ? "bg-white text-[#0F2962] shadow-sm"
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
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-white text-[#0F2962] shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image File</span>
          </button>
        </div>

        {/* Drawing Mode */}
        {activeTab === "draw" && (
          <div className="space-y-2">
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden h-44 cursor-crosshair">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs">
                  <PenLine className="w-6 h-6 mb-1 opacity-50" />
                  <span>Sign your name here with mouse or finger</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Sign within the box line</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 font-semibold transition"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear Canvas</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/60 transition">
              {uploadedImage ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Signature Preview"
                    className="max-h-24 mx-auto object-contain border border-slate-200 bg-white p-2 rounded-lg"
                  />
                  <label className="inline-block px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
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
                <label className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-slate-400" />
                  <span className="block text-xs font-bold text-slate-700">
                    Upload official signature PNG/JPEG
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || (activeTab === "draw" && !hasDrawn) || (activeTab === "upload" && !uploadedImage)}
            className="px-5 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{isLoading ? "Saving..." : "Save E-Signature"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
