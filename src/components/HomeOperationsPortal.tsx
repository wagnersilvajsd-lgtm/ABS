import React, { useState, useMemo } from 'react';
import { Operation, Operator, OperatorMonthlyData } from '../types/abs';
import { calculateOperationSummary, formatMinutesToHours, formatPercent } from '../utils/calculations';
import {
  AVAILABLE_YEARS,
  MONTH_NAMES_PT,
  formatMonthKey,
  formatMonthLabel,
  getNextMonthKey,
  getPrevMonthKey,
  parseMonthKey
} from '../utils/calendar';
import {
  ExcelExportStyleConfig,
  exportMultiOperationExcelReport,
  loadExcelStyleConfig,
  saveExcelStyleConfig
} from '../utils/reports';
import { ExcelStyleConfigModal } from './ExcelStyleConfigPanel';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Image as ImageIcon,
  Moon,
  Palette,
  Plus,
  Sun,
  Trophy,
  Upload
} from 'lucide-react';

function getOperationAccentHex(opId: string, name: string): string {
  const key = `${opId} ${name}`.toLowerCase();
  if (key.includes('nascer')) return '#10b981';
  if (key.includes('caema')) return '#0284c7';
  if (key.includes('cagepa')) return '#0369a1';
  if (key.includes('sebrae')) return '#2563eb';
  if (key.includes('ses')) return '#0d9488';
  if (key.includes('caern')) return '#006772';
  return '#d89627';
}

interface HomeOperationsPortalProps {
  operations: Operation[];
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
  onSelectMonthKey?: (monthKey: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onEnterOperation: (operationId: string) => void;
  onAddOperation: (op: Omit<Operation, 'id'>) => void;
}

export const HomeOperationsPortal: React.FC<HomeOperationsPortalProps> = ({
  operations,
  operators,
  monthlyData,
  selectedMonthKey,
  onSelectMonthKey,
  isDark,
  setIsDark,
  onEnterOperation,
  onAddOperation
}) => {
  const [isAddOpModalOpen, setIsAddOpModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [excelStyle, setExcelStyle] = useState<ExcelExportStyleConfig>(() => loadExcelStyleConfig());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  const handleExcelStyleChange = (next: ExcelExportStyleConfig) => {
    setExcelStyle(next);
    saveExcelStyleConfig(next);
  };

  // Form states for New Operation directly from portal
  const [newOpName, setNewOpName] = useState('');
  const [newOpClient, setNewOpClient] = useState('');
  const [newOpLogoUrl, setNewOpLogoUrl] = useState('');
  const [newOpMetaAbs, setNewOpMetaAbs] = useState('3.0');
  const [newOpJornada, setNewOpJornada] = useState('380');
  const [newOpDesc, setNewOpDesc] = useState('');

  const monthLabel = formatMonthLabel(selectedMonthKey);
  const { year, month } = parseMonthKey(selectedMonthKey);
  const prevMonthKey = getPrevMonthKey(selectedMonthKey);
  const nextMonthKey = getNextMonthKey(selectedMonthKey);

  // Per-operation consolidated summaries
  const operationCards = useMemo(() => {
    return operations.map((op) => {
      const opOperators = operators.filter((o) => (o.operacaoId || 'caern') === op.id);
      const supSet = new Set<string>(op.supervisores || []);
      opOperators.forEach((o) => {
        if (o.supervisor) supSet.add(o.supervisor);
      });
      const supervisors = Array.from(supSet);
      const summary = calculateOperationSummary(opOperators, monthlyData, supervisors);

      return {
        op,
        supervisorsCount: supervisors.length,
        operatorsCount: opOperators.length,
        absGeral: summary.absGeral,
        minutosPerdidos: summary.totalMinutosPerdidos,
        minutosEscalados: summary.totalMinutosEscalados,
        isOpenForSetup: supervisors.length === 0 && opOperators.length === 0
      };
    });
  }, [operations, operators, monthlyData]);

  // Consolidated multi-operation totals and sorted ranking
  const executiveStats = useMemo(() => {
    let totalPerdidos = 0;
    let totalEscalados = 0;
    let opsComEquipe = 0;
    let opsNaMeta = 0;

    operationCards.forEach((c) => {
      totalPerdidos += c.minutosPerdidos;
      totalEscalados += c.minutosEscalados;
      if (c.operatorsCount > 0) {
        opsComEquipe += 1;
        if (c.absGeral <= (c.op.metaAbs || 0.03)) {
          opsNaMeta += 1;
        }
      }
    });

    const absConsolidado = totalEscalados > 0 ? totalPerdidos / totalEscalados : 0;

    const ranked = [...operationCards].sort((a, b) => {
      if (a.operatorsCount === 0 && b.operatorsCount > 0) return 1;
      if (b.operatorsCount === 0 && a.operatorsCount > 0) return -1;
      return a.absGeral - b.absGeral;
    });

    return {
      totalPerdidos,
      totalEscalados,
      absConsolidado,
      opsComEquipe,
      opsNaMeta,
      ranked
    };
  }, [operationCards]);

  // Global counts across all operations
  const totals = useMemo(() => {
    const supSet = new Set<string>();
    operationCards.forEach((c) => {
      (c.op.supervisores || []).forEach((s) => supSet.add(`${c.op.id}::${s}`));
    });
    operators.forEach((o) => {
      if (o.supervisor) supSet.add(`${o.operacaoId || 'caern'}::${o.supervisor}`);
    });
    return {
      totalOperations: operations.length,
      totalSupervisors: supSet.size,
      totalOperators: operators.length
    };
  }, [operations.length, operationCards, operators]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem válido (PNG, JPG, WEBP ou SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      if (file.type === 'image/svg+xml' || result.length <= 160000) {
        setNewOpLogoUrl(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setNewOpLogoUrl(canvas.toDataURL('image/png', 0.9));
        } else {
          setNewOpLogoUrl(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    onAddOperation({
      nome: newOpName.trim(),
      cliente: newOpClient.trim() || 'JSD Telecom',
      logoUrl: newOpLogoUrl.trim() || '/assets/aistudio/image_def6497f.png',
      metaAbs: (parseFloat(newOpMetaAbs) || 3.0) / 100,
      jornadaPadraoMin: parseInt(newOpJornada, 10) || 380,
      descricao: newOpDesc.trim() || 'Central Operacional e Atendimento',
      supervisores: []
    });
    setNewOpName('');
    setNewOpClient('');
    setNewOpLogoUrl('');
    setNewOpDesc('');
    setIsAddOpModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar: Clean 3-Zone Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/aistudio/image_def6497f.png"
              alt="JSD Telecom"
              referrerPolicy="no-referrer"
              className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 border border-slate-200 dark:border-slate-700"
            />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
              JSD Telecom
            </span>
          </div>

          {onSelectMonthKey ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf] mr-0.5" />
              <button
                type="button"
                disabled={!prevMonthKey}
                onClick={() => prevMonthKey && onSelectMonthKey(prevMonthKey)}
                title="Mês anterior"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={month}
                onChange={(e) => onSelectMonthKey(formatMonthKey(year, parseInt(e.target.value, 10)))}
                aria-label="Selecionar mês no portal"
                className="h-7 px-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {MONTH_NAMES_PT.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => onSelectMonthKey(formatMonthKey(parseInt(e.target.value, 10), month))}
                aria-label="Selecionar ano no portal"
                className="h-7 px-2 text-xs font-semibold font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[#006772] dark:text-[#2dd4bf] cursor-pointer"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!nextMonthKey}
                onClick={() => nextMonthKey && onSelectMonthKey(nextMonthKey)}
                title="Próximo mês"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CalendarDays className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
              <span>Portal de Operações WFM</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{monthLabel}</span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
              className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg btn-press shrink-0 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setIsAddOpModalOpen(true);
              }}
              className="h-9 px-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg btn-press whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Operação</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-view-enter">
        {/* Hero Strip */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] mb-1.5">
                Controle de Absenteísmo e Escalas
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-balance">
                Selecione uma Operação para Acessar
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Escolha abaixo a operação desejada para abrir os apontamentos diários, gerenciar supervisores e colaboradores e acompanhar o painel executivo WFM.
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0 font-mono tabular-nums text-xs">
              <div>
                <span className="text-slate-400 block font-sans">Operações</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totals.totalOperations}
                </span>
              </div>
              <div className="h-9 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-slate-400 block font-sans">Supervisores</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totals.totalSupervisors}
                </span>
              </div>
              <div className="h-9 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-slate-400 block font-sans">Colaboradores</span>
                <span className="text-xl font-bold text-[#006772] dark:text-[#2dd4bf]">
                  {totals.totalOperators}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Operations Selection Grid (Primary Access Above Ranking) */}
        {operationCards.length === 0 ? (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Nenhuma operação cadastrada
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastre uma nova operação para começar.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {operationCards.map(({ op, supervisorsCount, operatorsCount, absGeral, isOpenForSetup }) => {
              const metaLimit = op.metaAbs || 0.03;
              const withinMeta = absGeral <= metaLimit;
              const diffPp = (absGeral - metaLimit) * 100;
              const showFallback = !op.logoUrl || brokenLogos[op.id];
              const accentHex = getOperationAccentHex(op.id, op.nome);

              return (
                <article
                  key={op.id}
                  style={{ borderTopColor: accentHex, borderTopWidth: '3px' }}
                  className={`h-full bg-white dark:bg-slate-900 rounded-xl border p-6 flex flex-col justify-between hover-lift ${
                    isOpenForSetup
                      ? 'border-dashed border-slate-300 dark:border-slate-700'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Logo + Operation Name & Client */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {showFallback ? (
                          <Building2 className="w-7 h-7 text-[#006772]" />
                        ) : (
                          <img
                            src={op.logoUrl}
                            alt={op.nome}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenLogos((prev) => ({ ...prev, [op.id]: true }))
                            }
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                          {op.nome}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {op.cliente}
                        </p>
                      </div>
                    </div>

                    {/* Description & Unboxed Metadata */}
                    <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
                      {op.descricao || 'Central Operacional e Controle de Absenteísmo WFM.'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span
                        className={
                          isOpenForSetup
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : 'font-medium text-[#006772] dark:text-[#2dd4bf]'
                        }
                      >
                        {isOpenForSetup ? 'Em aberto para cadastro' : 'Com equipe cadastrada'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Meta ≤ {(metaLimit * 100).toFixed(1)}%
                      </span>
                      {!isOpenForSetup && operatorsCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono tabular-nums text-[11px] font-semibold ${
                              withinMeta
                                ? 'text-[#006772] dark:text-[#2dd4bf]'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {diffPp <= 0
                              ? `${diffPp.toFixed(2)} p.p.`
                              : `+${diffPp.toFixed(2)} p.p.`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Consolidated Metrics & Action */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Supervisores</span>
                        <span className="font-bold font-mono tabular-nums text-sm text-slate-900 dark:text-slate-100">
                          {supervisorsCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Colaboradores</span>
                        <span className="font-bold font-mono tabular-nums text-sm text-slate-900 dark:text-slate-100">
                          {operatorsCount}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 block">ABS Atual</span>
                        <span
                          className={`font-bold font-mono tabular-nums text-sm ${
                            withinMeta
                              ? 'text-[#006772] dark:text-[#2dd4bf]'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatPercent(absGeral)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEnterOperation(op.id)}
                      className="w-full h-10 px-4 flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg btn-press cursor-pointer"
                    >
                      <span>Abrir Operação</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Visão Executiva Multi-Operações & Ranking Comparativo */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#005059] text-white flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#f0ad35]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Visão Executiva Multi-Operações &amp; Ranking Comparativo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Consolidado da JSD Telecom em {monthLabel} · Comparação direta entre todas as operações e exportação gerencial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  setExcelStyle(loadExcelStyleConfig());
                  setIsStyleModalOpen(true);
                }}
                title="Escolher paleta de cores e estilo da planilha XLSX"
                className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg btn-press whitespace-nowrap cursor-pointer"
              >
                <span
                  className="w-3 h-3 rounded-xs border border-black/15"
                  style={{ backgroundColor: excelStyle.headerColor }}
                />
                <span
                  className="w-3 h-3 rounded-xs border border-black/15 -ml-1"
                  style={{ backgroundColor: excelStyle.highlightColor }}
                />
                <Palette className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
                <span>Estilo XLSX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void exportMultiOperationExcelReport({
                    operations,
                    operators,
                    monthlyData,
                    selectedMonthKey,
                    styleConfig: excelStyle
                  });
                }}
                className="h-9 px-4 flex items-center gap-2 text-xs font-semibold text-white bg-[#005059] hover:bg-[#003e45] rounded-lg btn-press whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#f0ad35]" />
                <span>Relatório Geral XLSX</span>
              </button>
            </div>
          </div>

          {/* 4-Column Consolidated Executive Strip */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <div className="bg-[#005059] text-white rounded-xl p-4 border border-[#003e45] flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-teal-100 uppercase tracking-wide">
                ABS Geral Consolidado
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums mt-2">
                {formatPercent(executiveStats.absConsolidado)}
              </div>
              <span className="text-[11px] text-teal-200/90 mt-1">
                Ponderado sobre todas as operações
              </span>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Minutos Perdidos Totais
              </span>
              <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-2">
                {executiveStats.totalPerdidos.toLocaleString('pt-BR')} min
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-1">
                ≈ {formatMinutesToHours(executiveStats.totalPerdidos)} de ausência
              </span>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Minutos Escalados Totais
              </span>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
                {executiveStats.totalEscalados.toLocaleString('pt-BR')} min
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-1">
                ≈ {formatMinutesToHours(executiveStats.totalEscalados)} previstos
              </span>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Operações na Meta
              </span>
              <div className="text-xl font-bold font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf] mt-2">
                {executiveStats.opsNaMeta} / {executiveStats.opsComEquipe} ativas
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {operations.length - executiveStats.opsComEquipe} em aberto para cadastro
              </span>
            </div>
          </div>

          {/* Comparative Ranking Table */}
          <div className="mt-5 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#005059] text-white font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">Pos.</th>
                  <th className="py-2.5 px-4">Operação</th>
                  <th className="py-2.5 px-3 text-center">Superv.</th>
                  <th className="py-2.5 px-3 text-center">Colab.</th>
                  <th className="py-2.5 px-4 text-right">Min. Perdidos</th>
                  <th className="py-2.5 px-4 text-right">Min. Escalados</th>
                  <th className="py-2.5 px-3 text-center">Meta</th>
                  <th className="py-2.5 px-4 text-right bg-[#003e45]">ABS</th>
                  <th className="py-2.5 px-4">Situação / Desvio</th>
                  <th className="py-2.5 px-3 text-right">Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {executiveStats.ranked.map((item, idx) => {
                  const metaLimit = item.op.metaAbs || 0.03;
                  const withinMeta = item.absGeral <= metaLimit;
                  const diffPp = (item.absGeral - metaLimit) * 100;
                  const barPct = Math.min(100, (item.absGeral / (metaLimit * 2)) * 100);

                  return (
                    <tr
                      key={item.op.id}
                      className="h-11 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-400 font-semibold">
                        #{idx + 1}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-white border border-slate-200 dark:border-slate-700 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            {!item.op.logoUrl || brokenLogos[item.op.id] ? (
                              <Building2 className="w-3.5 h-3.5 text-[#006772]" />
                            ) : (
                              <img
                                src={item.op.logoUrl}
                                alt={item.op.nome}
                                referrerPolicy="no-referrer"
                                className="max-w-full max-h-full w-auto h-auto object-contain rounded-sm"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                              {item.op.nome}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {item.op.cliente}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.supervisorsCount}
                      </td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.operatorsCount}
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                        {item.minutosPerdidos.toLocaleString('pt-BR')}m
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.minutosEscalados.toLocaleString('pt-BR')}m
                      </td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {(metaLimit * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums font-bold">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={
                              item.operatorsCount === 0
                                ? 'text-slate-400'
                                : withinMeta
                                ? 'text-[#006772] dark:text-[#2dd4bf]'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {formatPercent(item.absGeral)}
                          </span>
                          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.operatorsCount === 0 ? 0 : barPct}%` }}
                              className={`h-full rounded-full ${
                                withinMeta ? 'bg-[#006772] dark:bg-[#2dd4bf]' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {item.isOpenForSetup || item.operatorsCount === 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Em aberto
                          </span>
                        ) : withinMeta ? (
                          <span className="text-[#006772] dark:text-[#2dd4bf] font-semibold">
                            Na meta <span className="font-mono text-[11px]">({diffPp.toFixed(2)} p.p.)</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            Acima <span className="font-mono text-[11px]">(+{diffPp.toFixed(2)} p.p.)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onEnterOperation(item.op.id)}
                          className="text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Abrir →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            JSD Telecom · Sistema Automatizado de Controle de Absenteísmo (ABS) · WFM
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Calendário Real 2025–2030 · Regra CLT 36h / 380 min diários
          </span>
        </div>
      </footer>

      {/* Modal: Criar Nova Operação */}
      {isAddOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#006772]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar Nova Operação
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperation} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Nome da Operação:
                </label>
                <input
                  type="text"
                  required
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="Ex: Operação Neoenergia"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Cliente / Contratante:
                </label>
                <input
                  type="text"
                  value={newOpClient}
                  onChange={(e) => setNewOpClient(e.target.value)}
                  placeholder="Ex: Grupo Neoenergia"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Meta ABS (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="20"
                    value={newOpMetaAbs}
                    onChange={(e) => setNewOpMetaAbs(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Jornada Diária (min):
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="600"
                    value={newOpJornada}
                    onChange={(e) => setNewOpJornada(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wide">
                  Imagem / Logo da Operação:
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {newOpLogoUrl ? (
                        <img
                          src={newOpLogoUrl}
                          alt="Prévia da logo"
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload da Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </label>
                      {newOpLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewOpLogoUrl('')}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newOpLogoUrl}
                    onChange={(e) => setNewOpLogoUrl(e.target.value)}
                    placeholder="Ou cole o caminho da imagem..."
                    className="w-full h-9 px-3 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Descrição Operacional:
                </label>
                <textarea
                  rows={2}
                  value={newOpDesc}
                  onChange={(e) => setNewOpDesc(e.target.value)}
                  placeholder="Informações e objetivos desta operação..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar e Abrir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ExcelStyleConfigModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        styleConfig={excelStyle}
        onStyleChange={handleExcelStyleChange}
        title="Personalizar Estilo do Consolidado Multi-Operações"
        onExportNow={() => {
          void exportMultiOperationExcelReport({
            operations,
            operators,
            monthlyData,
            selectedMonthKey,
            styleConfig: excelStyle
          });
        }}
      />
    </div>
  );
};
