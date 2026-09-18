import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';

interface StructuredDataViewerProps {
  data: any;
  type?: 'kpi' | 'evidence' | 'criteria' | 'requirements' | 'auto';
  title?: string;
  emptyMessage?: string;
}

export const StructuredDataViewer: React.FC<StructuredDataViewerProps> = ({
  data,
  type = 'auto',
  title,
  emptyMessage = 'No details specified',
}) => {
  const { success, error } = useToast();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<string | null>(null);

  if (data === undefined || data === null || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return <p className="text-xs text-slate-400 italic py-1">{emptyMessage}</p>;
  }

  // Helper for evidence viewing in new browser tab
  const handleViewEvidence = async (key: string, fileUrlOrName: string, originalName?: string) => {
    try {
      setViewingKey(key);
      await submissionService.viewEvidenceFile(fileUrlOrName, originalName);
      success('Opening Document', `Opened ${originalName || 'evidence artifact'} in viewer`);
    } catch (err: any) {
      error('Viewing Failed', err.response?.data?.detail || 'Could not view evidence document');
    } finally {
      setViewingKey(null);
    }
  };

  // Helper for evidence direct download
  const handleDownloadEvidence = async (key: string, fileUrlOrName: string, originalName?: string) => {
    try {
      setDownloadingKey(key);
      await submissionService.downloadEvidenceFileAs(fileUrlOrName, originalName);
      success('Download Started', `Saved ${originalName || 'evidence artifact'}`);
    } catch (err: any) {
      error('Download Failed', err.response?.data?.detail || 'Could not download evidence document');
    } finally {
      setDownloadingKey(null);
    }
  };

  // Check if a string is an evidence file path/URL
  const isEvidencePath = (s: string) => {
    const lower = s.toLowerCase();
    return (
      lower.includes('/evidence-files/') ||
      lower.includes('uploads/evidence') ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.csv') ||
      lower.endsWith('.pptx') ||
      lower.endsWith('.docx')
    );
  };

  // Handle String data
  if (typeof data === 'string') {
    if (type === 'evidence' || isEvidencePath(data)) {
      const fileName = data.includes('/') ? data.split('/').pop()! : data;
      const isDownloading = downloadingKey === 'single_file';
      const isViewing = viewingKey === 'single_file';

      return (
        <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate capitalize">
                {fileName.replace(/_/g, ' ')}
              </p>
              <span className="text-[10px] text-slate-500 block truncate">Attached Document</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              disabled={isViewing || isDownloading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewEvidence('single_file', data, fileName);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
              title="View Document in Tab"
            >
              {isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
              <span>View</span>
            </button>

            <button
              type="button"
              disabled={isDownloading || isViewing}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadEvidence('single_file', data, fileName);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50"
              title="Download Document"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download</span>
            </button>
          </div>
        </div>
      );
    }

    // Check if URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return (
        <a
          href={data}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:underline py-1"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="truncate">{data}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    return <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{data}</p>;
  }

  // Handle Array data
  if (Array.isArray(data)) {
    if (type === 'evidence' || data.some((item) => typeof item === 'string' ? isEvidencePath(item) : typeof item === 'object' && item !== null && (item.url || item.filename))) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.map((item, idx) => {
            const isObj = typeof item === 'object' && item !== null;
            const fileUrl = isObj ? item.url || item.file_url || item.saved_name || '' : String(item);
            const fileName = isObj ? item.filename || item.saved_name || `document_${idx + 1}` : String(item).split('/').pop()!;
            const fileSize = isObj && item.size_bytes ? `${(item.size_bytes / 1024).toFixed(1)} KB` : 'Attached Evidence';
            const isDownloading = downloadingKey === `arr_${idx}`;
            const isViewing = viewingKey === `arr_${idx}`;

            return (
              <div
                key={idx}
                className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate capitalize">
                      {fileName.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-slate-500 block truncate">{fileSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={isViewing || isDownloading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewEvidence(`arr_${idx}`, fileUrl, fileName);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloading || isViewing}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownloadEvidence(`arr_${idx}`, fileUrl, fileName);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Check if this data is Evidence Files dictionary
  const isEvidenceDictionary =
    type === 'evidence' ||
    Object.values(data).some(
      (v: any) =>
        (typeof v === 'object' && v !== null && (v.url || v.saved_name || v.filename)) ||
        (typeof v === 'string' && isEvidencePath(v))
    );

  if (isEvidenceDictionary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(data).map(([key, val]: [string, any]) => {
          const isObj = typeof val === 'object' && val !== null;
          const fileUrl = isObj ? val.url || val.file_url || val.saved_name || '' : String(val);
          const fileName = isObj ? val.filename || val.saved_name || key : key;
          const fileSize = isObj && val.size_bytes ? `${(val.size_bytes / 1024).toFixed(1)} KB` : 'Attached Evidence';
          const isDownloading = downloadingKey === key;
          const isViewing = viewingKey === key;

          return (
            <div
              key={key}
              className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate capitalize">
                    {fileName.replace(/_/g, ' ')}
                  </p>
                  <span className="text-[10px] text-slate-500 block truncate">{fileSize}</span>
                </div>
              </div>

              {fileUrl ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={isViewing || isDownloading}
                    onClick={() => handleViewEvidence(key, fileUrl, fileName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                    title="View Document in Tab"
                  >
                    {isViewing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloading || isViewing}
                    onClick={() => handleDownloadEvidence(key, fileUrl, fileName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50"
                    title="Download Document"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                  {String(val)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Check if this data is Structured KPI Dictionary (e.g., target, actual_measured, unit, status)
  const isKpiScorecard = Object.values(data).some(
    (v: any) => typeof v === 'object' && v !== null && ('target' in v || 'actual_measured' in v || 'unit' in v)
  );

  if (isKpiScorecard) {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-3.5 py-2.5">KPI Metric</th>
              <th className="px-3.5 py-2.5">Target Requirement</th>
              <th className="px-3.5 py-2.5">Measured Startup Outcome</th>
              <th className="px-3.5 py-2.5 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {Object.entries(data).map(([metricKey, metricVal]: [string, any]) => {
              const isObj = typeof metricVal === 'object' && metricVal !== null;
              const target = isObj ? metricVal.target || 'Standard Benchmark' : '—';
              const actual = isObj ? metricVal.actual_measured || metricVal.actual || 'Reported' : String(metricVal);
              const statusVal = isObj ? metricVal.status || 'VERIFIED' : 'MET';

              return (
                <tr key={metricKey} className="hover:bg-slate-50/60">
                  <td className="px-3.5 py-2.5 text-slate-900 font-bold capitalize">
                    {metricKey.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">
                    {target}
                  </td>
                  <td className="px-3.5 py-2.5 text-emerald-700 font-bold font-mono">
                    {actual}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {statusVal}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Standard Key-Value Table / Card list for general structured properties
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
          <tr>
            <th className="px-3.5 py-2.5">Parameter / Metric</th>
            <th className="px-3.5 py-2.5">Specification / Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {Object.entries(data)
            .filter(([k]) => k !== 'assigned_evaluator')
            .map(([k, v]) => {
              let displayVal: React.ReactNode;
              if (v === null || v === undefined) {
                displayVal = <span className="text-slate-400 italic">Not specified</span>;
              } else if (typeof v === 'object') {
                if (Array.isArray(v)) {
                  displayVal = (
                    <div className="flex flex-wrap gap-1">
                      {v.map((item, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          {String(item)}
                        </span>
                      ))}
                    </div>
                  );
                } else {
                  displayVal = (
                    <div className="space-y-1">
                      {Object.entries(v).map(([subK, subV]) => (
                        <div key={subK} className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-500 font-medium capitalize">{subK.replace(/_/g, ' ')}:</span>
                          <span className="font-bold text-slate-800">{String(subV)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
              } else if (typeof v === 'boolean') {
                displayVal = (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {v ? 'REQUIRED / YES' : 'NO'}
                  </span>
                );
              } else if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))) {
                displayVal = (
                  <a href={v} target="_blank" rel="noreferrer" className="text-gov-blue hover:underline font-bold inline-flex items-center gap-1">
                    <span>{v}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                );
              } else {
                displayVal = <span className="text-slate-800 font-semibold">{String(v)}</span>;
              }

              return (
                <tr key={k} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-700 font-bold capitalize">
                    {k.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {displayVal}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default StructuredDataViewer;
