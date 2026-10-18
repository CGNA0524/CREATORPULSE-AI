"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { ImportJob } from "@/types";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function DataManagementPage() {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const jobs = await api.get<ImportJob[]>("/imports");
      setImportJobs(jobs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setValidationResult(null);
    setSuccessMsg(null);
    setValidating(true);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const res = await api.upload<any>("/imports/validate", formData);
      setValidationResult(res);
    } catch (err: any) {
      alert(err.message || "File validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!file) return;
    setImporting(true);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.upload<ImportJob>("/imports/upload", formData);
      setSuccessMsg(`Import complete! ${res.successful_rows} rows inserted successfully.`);
      setFile(null);
      setValidationResult(null);
      fetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to commit import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Data Management & Ingestion"
        subtitle="Import campaign performance records via CSV or Excel with schema validation and error tracking."
      >
        <a
          href="http://localhost:8000/api/v1/imports/template/download"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-border hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4 text-secondary" />
          <span>Download Import Template</span>
        </a>
      </PageHeader>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* File Upload & Preview Section */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div>
          <h3 className="text-base font-bold text-white mb-1">Upload Performance Records</h3>
          <p className="text-xs text-muted">
            Supports .csv and .xlsx files. Required fields: campaign_name, influencer_handle, platform, date, spend, impressions, reach, engagements, clicks, conversions, attributed_revenue.
          </p>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 text-center transition-colors bg-background/50">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-white mb-1">
              {file ? file.name : "Click to select CSV or Excel file"}
            </span>
            <span className="text-xs text-muted">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Drag and drop or browse files"}
            </span>
          </label>
        </div>

        {validating && (
          <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-secondary" />
            <span>Validating headers, formats, and funnel integrity...</span>
          </div>
        )}

        {/* Validation Summary & Preview */}
        {validationResult && (
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">Validation Summary:</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                  {validationResult.valid_rows} Valid Rows
                </span>
                {validationResult.invalid_rows > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-500/30">
                    {validationResult.invalid_rows} Invalid Rows
                  </span>
                )}
              </div>

              <button
                onClick={handleCommitImport}
                disabled={importing || validationResult.valid_rows === 0}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{importing ? "Importing to Database..." : "Commit Records to Database"}</span>
              </button>
            </div>

            {/* Errors List */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Warnings ({validationResult.errors.length}):</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-rose-200">
                  {validationResult.errors.map((err: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-mono text-rose-400">Row {err.row}:</span>
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Record Preview Table */}
            {validationResult.preview && validationResult.preview.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">Preview (First 10 records):</span>
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-background text-muted">
                      <tr>
                        <th className="p-2.5">Campaign</th>
                        <th className="p-2.5">Creator</th>
                        <th className="p-2.5">Platform</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Spend</th>
                        <th className="p-2.5">Clicks</th>
                        <th className="p-2.5">Conversions</th>
                        <th className="p-2.5">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {validationResult.preview.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-card-hover">
                          <td className="p-2.5 font-medium text-white">{row.campaign_name}</td>
                          <td className="p-2.5 text-slate-300">@{row.influencer_handle}</td>
                          <td className="p-2.5">{row.platform}</td>
                          <td className="p-2.5">{row.date}</td>
                          <td className="p-2.5 text-slate-300 font-mono">₹{row.spend}</td>
                          <td className="p-2.5">{row.clicks}</td>
                          <td className="p-2.5 font-semibold text-white">{row.conversions}</td>
                          <td className="p-2.5 text-emerald-400 font-mono">₹{row.attributed_revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Import Jobs Table */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Import History & Audit</h3>
            <p className="text-xs text-muted">Historical data loads and processing logs</p>
          </div>
        </div>

        {importJobs.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted border border-dashed border-border rounded-xl">
            No historical import jobs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Job ID</th>
                  <th className="pb-3 font-medium">Filename</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total Rows</th>
                  <th className="pb-3 font-medium">Success</th>
                  <th className="pb-3 font-medium">Failed</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-card-hover/50 transition-colors">
                    <td className="py-3 font-mono text-slate-400">#{job.id}</td>
                    <td className="py-3 font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" />
                      <span>{job.filename}</span>
                    </td>
                    <td className="py-3 font-semibold text-muted">{job.file_type}</td>
                    <td className="py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3 font-medium text-white">{job.total_rows}</td>
                    <td className="py-3 font-bold text-emerald-400">{job.successful_rows}</td>
                    <td className="py-3 font-bold text-rose-400">{job.failed_rows}</td>
                    <td className="py-3 text-muted">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
