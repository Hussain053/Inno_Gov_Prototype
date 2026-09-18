import React from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';

export interface RequirementField {
  key: string;
  value: string;
}

interface RequirementsFormBuilderProps {
  minTeamSize: number;
  onMinTeamSizeChange: (val: number) => void;
  domain: string;
  onDomainChange: (val: string) => void;
  trlRequired: number;
  onTrlRequiredChange: (val: number) => void;
  warrantyYears: number;
  onWarrantyYearsChange: (val: number) => void;
  customFields: RequirementField[];
  onCustomFieldsChange: (fields: RequirementField[]) => void;
  readOnly?: boolean;
}

export const RequirementsFormBuilder: React.FC<RequirementsFormBuilderProps> = ({
  minTeamSize,
  onMinTeamSizeChange,
  domain,
  onDomainChange,
  trlRequired,
  onTrlRequiredChange,
  warrantyYears,
  onWarrantyYearsChange,
  customFields,
  onCustomFieldsChange,
  readOnly = false,
}) => {
  const handleAddCustomField = () => {
    onCustomFieldsChange([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    onCustomFieldsChange(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    onCustomFieldsChange(
      customFields.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gov-blue" />
          Structured Eligibility &amp; Technical Requirements
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Minimum Team Capacity (Members) *
          </label>
          <input
            type="number"
            min="1"
            disabled={readOnly}
            value={minTeamSize}
            onChange={(e) => onMinTeamSizeChange(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Required Industry Domain *
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            placeholder="e.g. Solar Energy / CleanTech"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Minimum Technology Readiness Level (TRL 1–9)
          </label>
          <select
            disabled={readOnly}
            value={trlRequired}
            onChange={(e) => onTrlRequiredChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
          >
            <option value="5">TRL 5 – Technology validated in relevant environment</option>
            <option value="6">TRL 6 – Technology demonstrated in relevant environment</option>
            <option value="7">TRL 7 – System prototype demonstration in operational environment</option>
            <option value="8">TRL 8 – System complete and qualified</option>
            <option value="9">TRL 9 – Actual system proven in operational environment</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Warranty / Maintenance Support (Years)
          </label>
          <input
            type="number"
            min="0"
            disabled={readOnly}
            value={warrantyYears}
            onChange={(e) => onWarrantyYearsChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Additional Custom Requirements */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Additional Custom Requirements</span>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddCustomField}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gov-blue hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Requirement</span>
            </button>
          )}
        </div>

        {customFields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              disabled={readOnly}
              value={field.key}
              onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
              placeholder="Requirement Name (e.g. ISO Certification)"
              className="w-1/2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
            />
            <input
              type="text"
              disabled={readOnly}
              value={field.value}
              onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
              placeholder="Criteria (e.g. ISO 9001 / IEC 61215)"
              className="w-1/2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleRemoveCustomField(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementsFormBuilder;
