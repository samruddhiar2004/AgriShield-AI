import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Play,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import ApiService from '../services/api';

interface DataIngestionViewProps {
  onIngestionComplete: () => void;
}

export const DataIngestionView: React.FC<DataIngestionViewProps> = ({ onIngestionComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setResult(null);

      // Trigger auto-detection preview
      setLoadingPreview(true);
      const formData = new FormData();
      formData.append('file', selected);
      try {
        const previewData = await ApiService.previewDataset(formData);
        setPreview(previewData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to parse and grasp parameters from dataset.');
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const handleProcessIngestion = async () => {
    if (!file) return;
    setIngesting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    if (preview?.detected_mappings) {
      formData.append('custom_mapping', JSON.stringify(preview.detected_mappings));
    }

    try {
      const res = await ApiService.processDataset(formData);
      setResult(res);
      onIngestionComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ingestion execution encountered an error.');
    } finally {
      setIngesting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(ApiService.downloadTemplateUrl, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Dataset Ingestion & Parameter Grasper</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Automated Parameter Mapping</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload external CSV, Excel, or Parquet datasets. AgriShield grasps parameters, auto-completes weather gaps, and triggers instant outbreak predictions.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500/60 transition-colors text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div>
          <label className="cursor-pointer">
            <span className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
              Click to select a file
            </span>{' '}
            <span className="text-xs text-slate-500">or drag and drop your dataset</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls, .parquet, .json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-1">
            Supported formats: CSV, Excel (.xlsx, .xls), Apache Parquet (.parquet), JSON
          </p>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-emerald-600 font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ingestion Results Success Card */}
      {result && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{result.message}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
              <span className="text-slate-400">Rows Ingested</span>
              <p className="text-lg font-bold text-slate-900">{result.processed_rows}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
              <span className="text-slate-400">Villages Synced</span>
              <p className="text-lg font-bold text-slate-900">{result.villages_updated_or_created}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
              <span className="text-slate-400">Farmers Registered</span>
              <p className="text-lg font-bold text-slate-900">{result.farmers_registered}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
              <span className="text-slate-400">Predictions Computed</span>
              <p className="text-lg font-bold text-emerald-700">{result.predictions_recalculated}</p>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Grasper & Preview Section */}
      {loadingPreview ? (
        <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Grasping parameters and matching schema...</span>
        </div>
      ) : preview ? (
        <div className="space-y-6">
          {/* Detected Parameter Mappings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Detected Parameter Mappings</h3>
                <p className="text-xs text-slate-500">
                  How the columns in your file are mapped to AgriShield's intelligence engine
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-700">
                {preview.total_rows} Records Found
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {Object.entries(preview.detected_mappings).map(([field, matchedCol]: [string, any]) => (
                <div
                  key={field}
                  className={`p-3 rounded-xl border ${
                    matchedCol
                      ? 'bg-emerald-50/50 border-emerald-200/70'
                      : 'bg-slate-50 border-slate-200/60'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {field.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {matchedCol ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-800 truncate" title={matchedCol}>
                          {matchedCol}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic font-normal text-[11px]">
                        Auto-filled / Optional
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ingestion Execute CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Ready to ingest? Clicking below will update your database and recalibrate village disease heatmaps.
              </span>
              <button
                onClick={handleProcessIngestion}
                disabled={ingesting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Play className={`h-4 w-4 ${ingesting ? 'animate-spin' : ''}`} />
                <span>{ingesting ? 'Ingesting & Computing...' : 'Ingest Data & Recalculate Risk'}</span>
              </button>
            </div>
          </div>

          {/* 5-Row Data Preview Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Incoming Dataset Sample Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    {preview.columns.map((col: string) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {preview.preview_data.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {preview.columns.map((col: string) => (
                        <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                          {row[col] !== null ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
