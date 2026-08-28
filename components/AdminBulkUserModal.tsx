"use client";

import { useState } from "react";
import { parseUsersCsv, getSampleUsersCsvTemplate, BulkUserRow } from "@/lib/csv-parser";
import { bulkCreateUsersAction } from "@/actions/admin";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { useOptionalToast } from "@/components/ToastContext";

interface AdminBulkUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminBulkUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminBulkUserModalProps) {
  const [csvContent, setCsvContent] = useState("");
  const [parsedRows, setParsedRows] = useState<BulkUserRow[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; email?: string; message: string }>>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    createdCount: number;
    failedCount: number;
    errors: Array<{ email: string; message: string }>;
  } | null>(null);

  const toast = useOptionalToast();
  const showToast = toast?.showToast;

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      const { validRows, errors } = parseUsersCsv(content);
      setParsedRows(validRows);
      setParseErrors(errors);
      setHasParsed(true);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setCsvContent(text);
    if (text.trim()) {
      const { validRows, errors } = parseUsersCsv(text);
      setParsedRows(validRows);
      setParseErrors(errors);
      setHasParsed(true);
    } else {
      setParsedRows([]);
      setParseErrors([]);
      setHasParsed(false);
    }
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    if (typeof window === "undefined") return;
    const template = getSampleUsersCsvTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "sasdms_bulk_users_template.csv";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsLoading(true);
    setImportResult(null);

    try {
      const res = await bulkCreateUsersAction(parsedRows);
      setIsLoading(false);
      setImportResult({
        createdCount: res.createdCount,
        failedCount: res.failedCount,
        errors: res.errors,
      });

      if (res.success && res.createdCount > 0) {
        if (showToast) {
          showToast({
            title: "Bulk Provisioning Complete",
            message: `Successfully provisioned ${res.createdCount} institutional user account(s).`,
            type: "success",
            duration: 4000,
          });
        }
        onSuccess();
      }
    } catch {
      setIsLoading(false);
      setImportResult({
        createdCount: 0,
        failedCount: parsedRows.length,
        errors: [{ email: "System", message: "Network error processing bulk import." }],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl max-w-2xl w-full p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 border border-white/90 animate-in zoom-in-95 duration-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F2962] border border-blue-200/80 flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Bulk User Import (CSV)</h2>
              <span className="text-xs text-slate-500 font-medium block">
                Batch-create institutional accounts with unit assignments and credentials
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download helper */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
          <div className="space-y-0.5">
            <span className="font-bold block">Need the standard spreadsheet format?</span>
            <span className="text-blue-800 text-[11px] block">
              Columns: firstName, lastName, email, role, unitCode, employeeId, title
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-[#0F2962] hover:bg-blue-50 text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Upload & Text Area */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 bg-slate-50/50 transition">
            <label className="cursor-pointer block space-y-1">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <span className="block text-xs font-bold text-slate-700">
                Choose CSV file or drag & drop here
              </span>
              <span className="block text-[10px] text-slate-400">
                Accepts .csv files formatted with standard comma delimiters
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Or Paste CSV Data Directly:
            </label>
            <textarea
              rows={4}
              placeholder="firstName,lastName,email,role,unitCode,employeeId,title&#10;Juan,Dela Cruz,jdelacruz@firstasia.edu.ph,STAFF,CAREER,EMP-001,Officer"
              value={csvContent}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-[#0F2962] bg-white shadow-inner"
            />
          </div>
        </div>

        {/* Validation Summary & Preview */}
        {hasParsed && (
          <div className="space-y-3 border-t border-slate-200/80 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Parsing Summary:</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  ✓ {parsedRows.length} Valid
                </span>
                {parseErrors.length > 0 && (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    ✕ {parseErrors.length} Errors
                  </span>
                )}
              </div>
            </div>

            {/* Error Callouts */}
            {parseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900 max-h-32 overflow-y-auto">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Validation Issues Detected in CSV:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {parseErrors.map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.message} {err.email && `(${err.email})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Valid Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {parsedRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold">
                          {r.firstName} {r.lastName}
                        </td>
                        <td className="p-2 font-mono text-[11px]">{r.email}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold">
                            {r.role}
                          </span>
                        </td>
                        <td className="p-2 font-mono font-bold text-[10px]">{r.unitCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Execution Results Summary */}
        {importResult && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Import Execution Results</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>Created: <strong className="text-emerald-700">{importResult.createdCount}</strong></span>
              <span>Failed: <strong className="text-rose-700">{importResult.failedCount}</strong></span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 pt-1">
                {importResult.errors.map((e, idx) => (
                  <li key={idx}>
                    {e.email}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            {importResult ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isLoading || parsedRows.length === 0}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Provisioning {parsedRows.length} Accounts...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-amber-400" />
                <span>Import & Provision ({parsedRows.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
