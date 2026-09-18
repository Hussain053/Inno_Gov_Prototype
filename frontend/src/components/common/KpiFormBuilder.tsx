import React from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';

export interface KpiItem {
  name: string;
  target: string;
  unit: string;
  method?: string;
}

interface KpiFormBuilderProps {
  kpis: KpiItem[];
  onChange: (kpis: KpiItem[]) => void;
  readOnly?: boolean;
}

export const KpiFormBuilder: React.FC<KpiFormBuilderProps> = ({
  kpis,
  onChange,
  readOnly = false,
}) => {
  const handleAddRow = () => {
    onChange([
      ...kpis,
      { name: '', target: '', unit: '', method: '' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = kpis.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index: number, field: keyof KpiItem, value: string) => {
    const updated = kpis.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Measurable Benchmark KPIs
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add KPI Metric</span>
          </button>
        )}
      </div>

      {kpis.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50">
          No KPIs added yet. Click &quot;Add KPI Metric&quot; to define measurable benchmarks.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
            <span className="col-span-4">KPI Metric Name *</span>
            <span className="col-span-3">Target Value *</span>
            <span className="col-span-2">Unit / Scale</span>
            <span className="col-span-2">Measurement Method</span>
            {!readOnly && <span className="col-span-1 text-center">Action</span>}
          </div>

          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs"
            >
              <div className="col-span-4">
                <input
                  type="text"
                  required
                  disabled={readOnly}
                  value={kpi.name}
                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                  placeholder="e.g. Inverter Efficiency"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="text"
                  required
                  disabled={readOnly}
                  value={kpi.target}
                  onChange={(e) => handleFieldChange(index, 'target', e.target.value)}
                  placeholder="e.g. >=93.0 or <5"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-semibold text-emerald-700 disabled:bg-slate-50"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  disabled={readOnly}
                  value={kpi.unit}
                  onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                  placeholder="e.g. % / seconds"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  disabled={readOnly}
                  value={kpi.method || ''}
                  onChange={(e) => handleFieldChange(index, 'method', e.target.value)}
                  placeholder="e.g. SCADA log / lab test"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
                />
              </div>

              {!readOnly && (
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KpiFormBuilder;
