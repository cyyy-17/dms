"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  Crosshair,
  Layers,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { detectSignatoryPlacementAction } from "@/actions/approvals";
import { getSignedDocumentUrlAction } from "@/actions/documents";
import { getSignedSignatureUrlAction } from "@/actions/auth";

export interface StampCoordinates {
  page: number; // 0-indexed page number
  x: number; // PDF points from left (0 to 612 standard)
  y: number; // PDF points from bottom (0 to 792 standard)
  isCustom?: boolean;
}

interface VisualStampPlacerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  storagePath?: string | null;
  currentUser: {
    fullName: string;
    role: string;
    signaturePath?: string | null;
  };
  initialCoordinates?: StampCoordinates | null;
  onConfirm: (coords: StampCoordinates) => void;
}

export default function VisualStampPlacerModal({
  isOpen,
  onClose,
  documentId,
  storagePath,
  currentUser,
  initialCoordinates,
  onConfirm,
}: VisualStampPlacerModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const [isRenderingCanvas, setIsRenderingCanvas] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // PDF Document Native Dimensions in points (Letter default 612 x 792)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  });

  // Current Stamp Coordinates in PDF points
  const [coords, setCoords] = useState<StampCoordinates>({
    page: 0,
    x: 220,
    y: 450,
    isCustom: false,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewportWidth, setViewportWidth] = useState<number>(620);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setViewportWidth(Math.min(620, Math.max(280, window.innerWidth - 32)));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Stamp Dimensions in PDF points (Pure Signature)
  const STAMP_WIDTH = 140;
  const STAMP_HEIGHT = 48;

  // Load document preview URL and user signature image
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    if (storagePath) {
      getSignedDocumentUrlAction(storagePath)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.signedUrl) {
            setPdfUrl(res.signedUrl);
          }
        })
        .catch(() => {});
    }

    if (currentUser.signaturePath) {
      getSignedSignatureUrlAction(currentUser.signaturePath)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.signedUrl) {
            setSignatureImageUrl(res.signedUrl);
          }
        })
        .catch(() => {});
    }

    // Call server action to detect initial page dimensions and placement
    detectSignatoryPlacementAction(documentId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.coordinates) {
          const det = res.coordinates;
          setTotalPages(det.totalPages || 1);
          setPageDimensions({
            width: det.pageWidth || 612,
            height: det.pageHeight || 792,
          });

          const detected: StampCoordinates = {
            page: det.pageIndex,
            x: det.x,
            y: det.y,
            isCustom: false,
          };

          if (initialCoordinates) {
            setCoords(initialCoordinates);
            setCurrentPage(initialCoordinates.page);
          } else {
            setCoords(detected);
            setCurrentPage(det.pageIndex);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentId, storagePath, initialCoordinates, currentUser.signaturePath]);

  // High-Precision Pixel-Perfect PDF Canvas Rendering via pdfjs-dist
  useEffect(() => {
    if (!isOpen || !pdfUrl || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        setIsRenderingCanvas(true);

        const pdfjs = await import("pdfjs-dist");
        if (typeof window !== "undefined") {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(currentPage + 1);
        if (isCancelled) return;

        // Viewport at 2x scale for ultra-crisp high-DPI retina rendering
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const actualWidth = page.view[2] - page.view[0];
        const actualHeight = page.view[3] - page.view[1];
        setPageDimensions({
          width: actualWidth || 612,
          height: actualHeight || 792,
        });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderContext: any = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        if (!isCancelled) {
          setIsRenderingCanvas(false);
        }
      } catch (err) {
        console.error("[PDF_CANVAS_RENDER_ERROR]", err);
        if (!isCancelled) {
          setIsRenderingCanvas(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, pdfUrl, currentPage]);

  if (!isOpen) return null;

  // Handle clicking on the document canvas to position the stamp
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixel position in container to PDF point coordinates
    const scaleX = pageDimensions.width / rect.width;
    const scaleY = pageDimensions.height / rect.height;

    // PDF Y coordinate starts from the bottom (0 = bottom, pageDimensions.height = top)
    let pdfX = Math.round(clickX * scaleX - STAMP_WIDTH / 2);
    let pdfY = Math.round((rect.height - clickY) * scaleY - STAMP_HEIGHT / 2);

    // Bound within page margins
    pdfX = Math.max(15, Math.min(pageDimensions.width - STAMP_WIDTH - 15, pdfX));
    pdfY = Math.max(15, Math.min(pageDimensions.height - STAMP_HEIGHT - 15, pdfY));

    setCoords({
      page: currentPage,
      x: pdfX,
      y: pdfY,
      isCustom: true,
    });
  };

  // Convert PDF points (0-612, 0-792) to percentage in container for CSS positioning
  const leftPercent = (coords.x / pageDimensions.width) * 100;
  // PDF Y is from bottom, CSS top is from top
  const topPercent = ((pageDimensions.height - (coords.y + STAMP_HEIGHT)) / pageDimensions.height) * 100;
  const widthPercent = (STAMP_WIDTH / pageDimensions.width) * 100;
  const heightPercent = (STAMP_HEIGHT / pageDimensions.height) * 100;

  // Presets for quick 1-click positioning
  const applyPreset = (type: "recommending" | "prepared" | "approved" | "bottom-right") => {
    let targetX = 35;
    let targetY = 50;

    if (type === "approved") {
      // Top right section of approval block (Emmanuel S. Sator)
      targetX = pageDimensions.width - STAMP_WIDTH - 40;
      targetY = 550;
    } else if (type === "recommending") {
      // Recommending approval line (Aljon M. Tolentino)
      targetX = pageDimensions.width - STAMP_WIDTH - 40;
      targetY = 485;
    } else if (type === "prepared") {
      // Prepared by line (Dennis R. Ramos)
      targetX = pageDimensions.width - STAMP_WIDTH - 40;
      targetY = 350;
    } else if (type === "bottom-right") {
      targetX = pageDimensions.width - STAMP_WIDTH - 35;
      targetY = 35;
    }

    setCoords({
      page: currentPage,
      x: Math.round(targetX),
      y: Math.round(targetY),
      isCustom: true,
    });
  };

  const handleSaveAndConfirm = () => {
    onConfirm({
      ...coords,
      page: currentPage,
      isCustom: true,
    });
    onClose();
  };

  const baseContainerWidth = viewportWidth;
  const containerWidthPx = Math.round(baseContainerWidth * zoomScale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[94vh] flex flex-col bg-white shadow-2xl border border-white/90 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
                  Set Signature & Stamp Location
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9.5px] sm:text-[10px] font-black border border-blue-200">
                  1:1 Pixel Placement
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium hidden xs:block">
                Click directly on your signature line in the canvas below to position your official stamp.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Presets Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#0F2962] shrink-0" />
            <span className="text-[11px] font-bold text-slate-700">
              Selected: <strong className="font-mono text-[#0F2962]">Page {coords.page + 1} (X: {coords.x}pt, Y: {coords.y}pt)</strong>
            </span>
          </div>

          {/* Quick Presets & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.75, Math.round((z - 0.15) * 100) / 100))}
                className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[10px] font-bold text-slate-700 select-none">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.6, Math.round((z + 0.15) * 100) / 100))}
                className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer border-l border-slate-200"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Jumps */}
            <div className="flex flex-wrap items-center gap-1.5 pl-1 border-l border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick:</span>
              <button
                type="button"
                onClick={() => applyPreset("prepared")}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10.5px] sm:text-[11px] hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                Prepared by
              </button>
              <button
                type="button"
                onClick={() => applyPreset("recommending")}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10.5px] sm:text-[11px] hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                Recommending
              </button>
              <button
                type="button"
                onClick={() => applyPreset("approved")}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10.5px] sm:text-[11px] hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                Approved by
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Canvas Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-auto bg-slate-900/90 flex flex-col items-center justify-start min-h-0">
          {/* Page Switcher for Multi-Page Documents */}
          {totalPages > 1 && (
            <div className="mb-4 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl text-xs text-white shadow-md shrink-0">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Page:</span>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`px-2.5 py-0.5 rounded-md font-bold text-xs transition cursor-pointer ${
                    currentPage === idx ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Document Page Container with 1:1 High-Resolution Canvas */}
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            style={{
              width: `${containerWidthPx}px`,
              aspectRatio: `${pageDimensions.width} / ${pageDimensions.height}`,
            }}
            className="relative bg-white shadow-2xl rounded-xl overflow-hidden cursor-crosshair border border-slate-700 select-none transition-all hover:ring-4 hover:ring-blue-500/30 mb-8 shrink-0"
            title="Click anywhere on your signature line to place your electronic signature stamp"
          >
            {/* Native 1:1 Pixel Canvas rendered by PDF.js */}
            <canvas
              ref={canvasRef}
              className="w-full h-full block bg-white pointer-events-none"
            />

            {/* Loading Indicator */}
            {isRenderingCanvas && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Rendering high-resolution vector canvas...</span>
              </div>
            )}

            {/* Live Interactive Pure Electronic Signature Overlay */}
            {currentPage === coords.page && (
              <div
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
                className="absolute z-20 flex items-center justify-center cursor-move group select-none transition-all"
              >
                {/* Transparent bounding container with clear blue border and guidelines */}
                <div className="absolute inset-0 rounded-md border-2 border-dashed border-blue-600 bg-blue-500/5 pointer-events-none ring-2 ring-blue-500/20" />

                {/* The Pure E-Signature Itself (Transparent PNG) */}
                {signatureImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signatureImageUrl}
                    alt="Electronic Signature"
                    className="relative z-10 w-full h-full object-contain pointer-events-none select-none p-0.5"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-1 text-center pointer-events-none select-none bg-blue-50/80 rounded">
                    <span className="font-serif italic text-base text-[#0F2962] font-black tracking-wide leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                      Signature Placement
                    </span>
                  </div>
                )}

                {/* Floating Alignment Handle Tag */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#0F2962] text-amber-300 text-[8px] font-bold rounded-md shadow-md opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1">
                  <span>✍️ Electronic Signature</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Target Coordinates: </span>
            <span className="font-mono text-slate-500">
              Page {coords.page + 1} (X: {coords.x}pt, Y: {coords.y}pt)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAndConfirm}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Confirm Stamp Position</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
