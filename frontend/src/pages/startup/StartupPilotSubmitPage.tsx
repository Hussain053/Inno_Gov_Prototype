import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  Sparkles,
  Trash2,
  FileCheck2,
  ExternalLink,
  Plus,
  AlertCircle,
  Loader2,
  Eye,
  Download,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import submissionService from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';

interface MeasuredKpiRow {
  name: string;
  target: string;
  actual: string;
  unit: string;
  status: 'MET' | 'EXCEEDED' | 'IN_PROGRESS';
}

interface UploadedFileItem {
  filename: string;
  saved_name: string;
  url: string;
  size_bytes: number;
}

export const StartupPilotSubmitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pilotId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pilot, isLoading: pilotLoading } = useQuery({
    queryKey: ['pilot', pilotId],
    queryFn: () => pilotService.getPilot(pilotId),
    enabled: !!pilotId,
  });

  const { data: submissions } = useQuery({
    queryKey: ['pilot-submissions', pilotId],
    queryFn: () => submissionService.listSubmissions({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const existingSubmission = submissions?.[0];

  const [resultsText, setResultsText] = useState(
    'Successfully deployed and operated sandbox microgrid testbed over the 90-day observation trial. Achieved 99.98% continuous uptime with automatic sub-3 second failover during grid outage simulations.'
  );

  const [kpiRows, setKpiRows] = useState<MeasuredKpiRow[]>([
    { name: 'Operational Uptime', target: '>=99.9%', actual: '99.98%', unit: '%', status: 'EXCEEDED' },
    { name: 'System Efficiency', target: '>=90.0%', actual: '94.2%', unit: '%', status: 'EXCEEDED' },
    { name: 'Failover Switch Time', target: '<5s', actual: '2.4s', unit: 'sec', status: 'MET' },
    { name: 'Cloud SCADA Telemetry', target: 'Real-time', actual: 'Active (1-min freq)', unit: 'Status', status: 'MET' },
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      if (existingSubmission.results) {
        setResultsText(existingSubmission.results);
      }
      if (existingSubmission.kpi_results && typeof existingSubmission.kpi_results === 'object') {
        const rows: MeasuredKpiRow[] = Object.entries(existingSubmission.kpi_results).map(([k, v]) => ({
          name: k.replace(/_/g, ' ').toUpperCase(),
          target: 'Standard Benchmark',
          actual: String(v),
          unit: '',
          status: 'MET',
        }));
        if (rows.length > 0) setKpiRows(rows);
      }
      if (existingSubmission.evidence && typeof existingSubmission.evidence === 'object') {
        const files: UploadedFileItem[] = [];
        Object.entries(existingSubmission.evidence).forEach(([k, v]) => {
          if (typeof v === 'string') {
            files.push({
              filename: k,
              saved_name: k,
              url: v,
              size_bytes: 1024 * 150,
            });
          } else if (typeof v === 'object' && v !== null && (v as any).url) {
            files.push({
              filename: (v as any).filename || k,
              saved_name: (v as any).saved_name || k,
              url: (v as any).url,
              size_bytes: (v as any).size_bytes || 1024 * 100,
            });
          }
        });
        if (files.length > 0) setUploadedFiles(files);
      }
    } else if (pilot?.kpis && typeof pilot.kpis === 'object') {
      const rows: MeasuredKpiRow[] = Object.entries(pilot.kpis).map(([k, v]) => ({
        name: k.replace(/_/g, ' ').toUpperCase(),
        target: String(v),
        actual: String(v),
        unit: '',
        status: 'MET',
      }));
      if (rows.length > 0) setKpiRows(rows);
    }
  }, [existingSubmission, pilot]);

  // Handle Real File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await submissionService.uploadEvidenceFile(file);
        setUploadedFiles((prev) => [
          ...prev,
          {
            filename: res.filename,
            saved_name: res.saved_name,
            url: res.url,
            size_bytes: res.size_bytes,
          },
        ]);
      }
      success('File uploaded', 'Evidence artifact securely stored on server.');
    } catch (err: any) {
      error('File upload failed', err.response?.data?.detail || 'Could not upload evidence file.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [viewingFileIdx, setViewingFileIdx] = useState<number | null>(null);
  const [downloadingFileIdx, setDownloadingFileIdx] = useState<number | null>(null);

  const handleViewFile = async (idx: number, urlOrName: string, originalName?: string) => {
    try {
      setViewingFileIdx(idx);
      await submissionService.viewEvidenceFile(urlOrName, originalName);
      success('Opening Document', `Opened ${originalName || 'file'} in viewer`);
    } catch (err: any) {
      error('Could not open document', err.response?.data?.detail || 'Viewing failed');
    } finally {
      setViewingFileIdx(null);
    }
  };

  const handleDownloadFile = async (idx: number, urlOrName: string, originalName?: string) => {
    try {
      setDownloadingFileIdx(idx);
      await submissionService.downloadEvidenceFileAs(urlOrName, originalName);
      success('Download Started', `Saved ${originalName || 'file'}`);
    } catch (err: any) {
      error('Download Failed', err.response?.data?.detail || 'Could not download file');
    } finally {
      setDownloadingFileIdx(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddKpiRow = () => {
    setKpiRows((prev) => [
      ...prev,
      { name: '', target: '', actual: '', unit: '', status: 'MET' },
    ]);
  };

  const handleRemoveKpiRow = (index: number) => {
    setKpiRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKpiChange = (index: number, field: keyof MeasuredKpiRow, val: string) => {
    setKpiRows((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const saveAndSubmitMutation = useMutation({
    mutationFn: async () => {
      // Build structured KPI dictionary
      const kpiDict: Record<string, any> = {};
      kpiRows.forEach((row) => {
        if (row.name.trim()) {
          kpiDict[row.name.trim().toLowerCase().replace(/\s+/g, '_')] = {
            target: row.target,
            actual_measured: row.actual,
            unit: row.unit,
            status: row.status,
          };
        }
      });

      // Build structured Evidence dictionary
      const evidenceDict: Record<string, any> = {};
      uploadedFiles.forEach((file, idx) => {
        evidenceDict[`document_${idx + 1}`] = {
          filename: file.filename,
          url: file.url,
          size_bytes: file.size_bytes,
        };
      });

      let subId = existingSubmission?.id;

      if (!subId) {
        // Create draft submission
        const created = await submissionService.createSubmission({
          pilot_id: pilotId,
          results: resultsText,
          kpi_results: kpiDict,
          evidence: evidenceDict,
        });
        subId = created.id;
      } else if (existingSubmission && existingSubmission.status === 'DRAFT') {
        // Update draft submission
        await submissionService.updateSubmission(subId, {
          results: resultsText,
          kpi_results: kpiDict,
          evidence: evidenceDict,
        });
      }

      // Transition to SUBMITTED
      return await submissionService.submitSubmission(subId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-submissions', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['my-pilots'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Pilot evidence submitted successfully', 'Your submission is now waiting for evaluator review.');
      navigate('/startup/submissions');
    },
    onError: (err: any) => {
      error('Submission failed', err.response?.data?.detail || err.message || 'An error occurred during submission');
    },
  });

  const isAlreadySubmitted = existingSubmission && existingSubmission.status !== 'DRAFT';

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/startup/pilots/${pilotId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilot #{pilotId}
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Pilot Evidence &amp; Deliverables Submission</h1>
            <p className="text-xs text-slate-500">
              Submit measured performance benchmarks, field results summary, and verifiable audit evidence.
            </p>
          </div>
        </div>

        {isAlreadySubmitted && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-gov-blue">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              This pilot submission is already in <strong>{existingSubmission.status}</strong> status and cannot be edited.
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAndSubmitMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Results Narrative */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-gov-blue" />
            Detailed Pilot Results &amp; Deliverables Summary
          </h3>
          <p className="text-xs text-slate-500">
            Describe the deployment outcome against the sanctioned pilot's success criteria and milestones.
          </p>
          <textarea
            rows={4}
            required
            disabled={isAlreadySubmitted}
            value={resultsText}
            onChange={(e) => setResultsText(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed disabled:bg-slate-50"
          />
        </div>

        {/* Measured KPIs Table (Form-based, No Raw JSON) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Measured Performance Benchmarks (KPIs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Empirical values recorded during the trial to be evaluated by the independent panel.
              </p>
            </div>
            {!isAlreadySubmitted && (
              <button
                type="button"
                onClick={handleAddKpiRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
              <span className="col-span-4">Benchmark Metric</span>
              <span className="col-span-3">Target</span>
              <span className="col-span-3">Actual Value Measured *</span>
              <span className="col-span-1">Status</span>
              {!isAlreadySubmitted && <span className="col-span-1 text-center">Action</span>}
            </div>

            {kpiRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    required
                    disabled={isAlreadySubmitted}
                    value={row.name}
                    onChange={(e) => handleKpiChange(idx, 'name', e.target.value)}
                    placeholder="Metric Name"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-100 font-medium text-slate-800"
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="text"
                    disabled={isAlreadySubmitted}
                    value={row.target}
                    onChange={(e) => handleKpiChange(idx, 'target', e.target.value)}
                    placeholder="Target"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-100 text-slate-600"
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="text"
                    required
                    disabled={isAlreadySubmitted}
                    value={row.actual}
                    onChange={(e) => handleKpiChange(idx, 'actual', e.target.value)}
                    placeholder="e.g. 94.2% / 2.4s"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-bold text-emerald-700 disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-1">
                  <select
                    disabled={isAlreadySubmitted}
                    value={row.status}
                    onChange={(e) => handleKpiChange(idx, 'status', e.target.value as any)}
                    className="w-full px-1 py-1.5 text-[10px] font-bold bg-white border border-slate-200 rounded-lg outline-none text-emerald-700"
                  >
                    <option value="MET">MET</option>
                    <option value="EXCEEDED">EXCEEDED</option>
                    <option value="IN_PROGRESS">WIP</option>
                  </select>
                </div>

                {!isAlreadySubmitted && (
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveKpiRow(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Real Device File Upload & Attached Artifacts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Upload Technical Evidence &amp; Verification Documents
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload real telemetry datasets, lab test certificates (IEC/ISO), superintendent sign-offs, or photo proofs directly from your device.
              </p>
            </div>
          </div>

          {!isAlreadySubmitted && (
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  {isUploadingFile ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-700 hover:underline">
                    Click to select files from device
                  </span>
                  <span className="text-xs text-slate-500"> or drag and drop</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported: PDF, CSV, JSON, PNG, JPG, LOG (Up to 25MB each)
                </p>
              </label>
            </div>
          )}

          {/* Uploaded Files List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attached Artifacts ({uploadedFiles.length})
            </h4>

            {uploadedFiles.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files attached yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {uploadedFiles.map((f, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 truncate block">
                          {f.filename}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(f.size_bytes / 1024).toFixed(1)} KB • Stored securely in audit repository
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={viewingFileIdx === idx || downloadingFileIdx === idx}
                        onClick={() => handleViewFile(idx, f.url, f.filename)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                        title="View Document in Tab"
                      >
                        {viewingFileIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin text-gov-blue" />
                        ) : (
                          <Eye className="w-3 h-3 text-slate-600" />
                        )}
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        disabled={downloadingFileIdx === idx || viewingFileIdx === idx}
                        onClick={() => handleDownloadFile(idx, f.url, f.filename)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gov-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                        title="Download Document"
                      >
                        {downloadingFileIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin text-gov-blue" />
                        ) : (
                          <Download className="w-3 h-3 text-gov-blue" />
                        )}
                        <span>Download</span>
                      </button>

                      {!isAlreadySubmitted && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded ml-1"
                          title="Remove File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        {!isAlreadySubmitted && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to={`/startup/pilots/${pilotId}`}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveAndSubmitMutation.isPending || isUploadingFile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saveAndSubmitMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Finalize &amp; Submit Pilot Evidence
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default StartupPilotSubmitPage;
