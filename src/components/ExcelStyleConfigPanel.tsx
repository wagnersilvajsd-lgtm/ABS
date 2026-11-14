import React from 'react';
import {
  DEFAULT_EXCEL_STYLE,
  EXCEL_STYLE_PRESETS,
  ExcelExportStyleConfig
} from '../utils/reports';
import { Check, FileSpreadsheet, Palette, RotateCcw, X } from 'lucide-react';

interface ExcelStyleConfigPanelProps {
  value: ExcelExportStyleConfig;
  onChange: (next: ExcelExportStyleConfig) => void;
  compact?: boolean;
}

function getContrastColor(hex: string): string {
  const clean = (hex || '#FFFFFF').replace('#', '');
  if (clean.length !== 6) return '#0F172A';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.56 ? '#FFFFFF' : '#0F172A';
}

export const ExcelStyleConfigPanel: React.FC<ExcelStyleConfigPanelProps> = ({
  value,
  onChange,
  compact = false
}) => {
  const handleSelectPreset = (presetId: string) => {
    const preset = EXCEL_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...value,
      presetId: preset.id,
      ...preset.config
    });
  };

  const handleColorChange = (
    field: 'headerColor' | 'headerTextColor' | 'highlightColor' | 'zebraColor' | 'criticalRowColor',
    hex: string
  ) => {
    onChange({
      ...value,
      presetId: 'custom',
      [field]: hex.toUpperCase()
    });
  };

  const highlightTextColor = getContrastColor(value.highlightColor);

  return (
    <div className="space-y-4">
      {/* Header + Reset */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Paleta &amp; Estilo da Planilha XLSX
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_EXCEL_STYLE)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#006772] dark:text-slate-400 dark:hover:text-[#2dd4bf] cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Padrão JSD</span>
        </button>
      </div>

      {/* Presets Grid */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
        {EXCEL_STYLE_PRESETS.map((preset) => {
          const isSelected = value.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              title={preset.description}
              className={`relative text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#006772] dark:border-[#2dd4bf] bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-[#006772]/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1">
                  <span
                    className="w-4 h-4 rounded-sm border border-black/10 inline-block"
                    style={{ backgroundColor: preset.config.headerColor }}
                  />
                  <span
                    className="w-4 h-4 rounded-sm border border-black/10 inline-block"
                    style={{ backgroundColor: preset.config.highlightColor }}
                  />
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
                )}
              </div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                {preset.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Color Pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="color"
            value={value.headerColor}
            onChange={(e) => handleColorChange('headerColor', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Cabeçalhos
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              {value.headerColor}
            </span>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="color"
            value={value.headerTextColor}
            onChange={(e) => handleColorChange('headerTextColor', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Texto Cabeç.
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              {value.headerTextColor}
            </span>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="color"
            value={value.highlightColor}
            onChange={(e) => handleColorChange('highlightColor', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Destaque / Total
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              {value.highlightColor}
            </span>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="color"
            value={value.zebraColor}
            onChange={(e) => handleColorChange('zebraColor', e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Linhas Zebra
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              {value.zebraColor}
            </span>
          </div>
        </label>
      </div>

      {/* Presentation Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value.enableZebra}
              onChange={(e) => onChange({ ...value, enableZebra: e.target.checked })}
              className="rounded border-slate-300 text-[#006772] focus:ring-[#006772]"
            />
            <span>Linhas alternadas (Zebra)</span>
          </label>

          <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value.highlightCriticalRows}
              onChange={(e) =>
                onChange({ ...value, highlightCriticalRows: e.target.checked })
              }
              className="rounded border-slate-300 text-[#006772] focus:ring-[#006772]"
            />
            <span>Destacar linhas acima da meta</span>
          </label>
        </div>

        {value.highlightCriticalRows && (
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
            <span>Cor de alerta:</span>
            <input
              type="color"
              value={value.criticalRowColor}
              onChange={(e) => handleColorChange('criticalRowColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border border-slate-300 bg-transparent p-0"
            />
          </label>
        )}
      </div>

      {/* Live Visual Spreadsheet Preview */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white shadow-2xs">
        <div
          className="px-3 py-1.5 text-[11px] font-bold tracking-tight truncate"
          style={{
            backgroundColor: value.headerColor,
            color: value.headerTextColor
          }}
        >
          JSD TELECOM · RELATÓRIO GERENCIAL WFM (PRÉVIA)
        </div>
        <div
          className="px-3 py-1 text-[10px] italic truncate border-b"
          style={{
            backgroundColor: value.highlightColor,
            color: highlightTextColor,
            borderBottomColor: value.headerColor
          }}
        >
          Competência selecionada · Filtros ativos no cabeçalho
        </div>
        <div className="p-2 bg-white">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr
                style={{
                  backgroundColor: value.headerColor,
                  color: value.headerTextColor
                }}
              >
                <th className="py-1 px-2 text-left font-bold border border-black/15">
                  SUPERVISOR / OPERAÇÃO
                </th>
                <th className="py-1 px-2 text-right font-bold border border-black/15">
                  ABS (%)
                </th>
                <th className="py-1 px-2 text-center font-bold border border-black/15">
                  SITUAÇÃO
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white text-slate-800">
                <td className="py-1 px-2 border border-slate-200">Equipe Alpha</td>
                <td className="py-1 px-2 text-right font-mono font-bold border border-slate-200 bg-emerald-100 text-emerald-900">
                  1,85%
                </td>
                <td className="py-1 px-2 text-center font-bold border border-slate-200 bg-emerald-100 text-emerald-900">
                  Dentro da Meta
                </td>
              </tr>
              <tr
                style={{
                  backgroundColor: value.highlightCriticalRows
                    ? value.criticalRowColor
                    : value.enableZebra
                    ? value.zebraColor
                    : '#FFFFFF'
                }}
                className="text-slate-800"
              >
                <td className="py-1 px-2 border border-slate-200">Equipe Beta</td>
                <td className="py-1 px-2 text-right font-mono font-bold border border-slate-200 bg-rose-100 text-rose-900">
                  4,20%
                </td>
                <td className="py-1 px-2 text-center font-bold border border-slate-200 bg-rose-100 text-rose-900">
                  Acima da Meta
                </td>
              </tr>
              <tr
                style={{
                  backgroundColor: value.highlightColor,
                  color: highlightTextColor
                }}
                className="font-bold"
              >
                <td className="py-1 px-2 border border-slate-200">TOTAL CONSOLIDADO</td>
                <td className="py-1 px-2 text-right font-mono border border-slate-200">2,64%</td>
                <td className="py-1 px-2 text-center border border-slate-200">Dentro da Meta</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface ExcelStyleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleConfig: ExcelExportStyleConfig;
  onStyleChange: (next: ExcelExportStyleConfig) => void;
  onExportNow: () => void;
  title?: string;
}

export const ExcelStyleConfigModal: React.FC<ExcelStyleConfigModalProps> = ({
  isOpen,
  onClose,
  styleConfig,
  onStyleChange,
  onExportNow,
  title = 'Personalizar Estilo do Relatório XLSX'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#005059] text-white flex items-center justify-center">
              <Palette className="w-4 h-4 text-[#f0ad35]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha a paleta para cabeçalhos e linhas de destaque antes de gerar a planilha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <ExcelStyleConfigPanel value={styleConfig} onChange={onStyleChange} />
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Salvar e Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onExportNow();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#005059] hover:bg-[#003e45] rounded-lg shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#f0ad35]" />
            <span>Gerar Planilha XLSX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
