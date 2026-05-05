import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  X,
  TrendingUp,
  Cpu,
  Users,
  Activity,
  Eye,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';

export default function AdminLogsPage() {
  const [logs, setLogs]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | success | failed
  const [modelFilter, setModelFilter]   = useState('');
  const [selectedLog, setSelectedLog]   = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) loadLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, modelFilter]);

  const loadStats = async () => {
    try {
      const data = await api.getLogsStats(token);
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        search: search || undefined,
        model: modelFilter || undefined,
        success: statusFilter === 'all' ? undefined : statusFilter === 'success',
      };
      const data = await api.getLogs(token, page, limit, filters);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatusFilter('all');
    setModelFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const hasFilters = search || statusFilter !== 'all' || modelFilter;
  const availableModels = stats ? Object.keys(stats.models_breakdown) : [];

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="absolute inset-0 bg-grid-paper bg-grid-md opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="sticker-lime tilt-l-3 mb-3">
              <FileText className="w-3.5 h-3.5" />
              activity log
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink-900">
              lịch sử dịch
            </h1>
            <p className="text-sm text-ink-900/60 mt-1">
              <span className="font-bold text-ink-900">{total.toLocaleString()}</span>{' '}
              {hasFilters ? 'kết quả phù hợp' : 'bản dịch tổng cộng'}
            </p>
          </div>
          <Link to="/admin/settings" className="btn btn-ghost text-sm">
            <ChevronLeft className="w-4 h-4" />
            settings
          </Link>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="thành công"
              value={stats.successful.toLocaleString()}
              sub={`${stats.failed} thất bại`}
              variant="lime"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="tokens đã dùng"
              value={formatNumber(stats.total_tokens)}
              sub={`${stats.last_24h} req trong 24h`}
              variant="pink"
            />
            <StatCard
              icon={<Cpu className="w-5 h-5" />}
              label="models đang dùng"
              value={Object.keys(stats.models_breakdown).length}
              sub={topModel(stats.models_breakdown)}
              variant="zap"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="unique users"
              value={stats.unique_ips.toLocaleString()}
              sub={`${stats.last_7d} req / 7 ngày`}
              variant="lav"
            />
          </div>
        )}

        {/* Filter bar */}
        <div className="panel p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-900/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="tìm trong input/output..."
                  className="input pl-10 pr-10 py-2.5 text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-900/40 hover:text-ink-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-zap py-2.5 text-sm">
                tìm
              </button>
            </form>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Status filter */}
              <div className="flex items-center gap-1 bg-cream-100 border-2 border-ink-900/15 rounded-xl p-1">
                {[
                  { val: 'all', label: 'tất cả' },
                  { val: 'success', label: '✓' },
                  { val: 'failed', label: '✗' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => { setStatusFilter(opt.val); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                      statusFilter === opt.val
                        ? 'bg-ink-900 text-white'
                        : 'text-ink-900/60 hover:text-ink-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Model filter */}
              {availableModels.length > 0 && (
                <select
                  value={modelFilter}
                  onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border-2 border-ink-900/15 rounded-xl text-xs font-mono cursor-pointer hover:border-ink-900/30 transition-colors"
                >
                  <option value="">tất cả models</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-hot-500 font-bold hover:underline px-2"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        {loading ? (
          <div className="panel p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-hot-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="panel p-16 text-center">
            <p className="text-ink-900/50 font-medium">
              {hasFilters ? '🔍 không tìm thấy kết quả' : '📭 chưa có log nào'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {logs.map((log) => (
                <LogCardMobile
                  key={log.id}
                  log={log}
                  onClick={() => setSelectedLog(log)}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block panel overflow-hidden">
              <table className="w-full">
                <thead className="bg-cream-100 border-b-[3px] border-ink-900">
                  <tr className="text-left text-xs font-display font-bold uppercase tracking-wider text-ink-900">
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">input (slang)</th>
                    <th className="px-4 py-3">output (tiếng việt)</th>
                    <th className="px-4 py-3">model</th>
                    <th className="px-4 py-3 text-right">tokens</th>
                    <th className="px-4 py-3">ip</th>
                    <th className="px-4 py-3">time</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-ink-900/10">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="text-sm hover:bg-cream-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3">
                        {log.success
                          ? <CheckCircle2 className="w-5 h-5 text-lime-500" />
                          : <XCircle className="w-5 h-5 text-hot-500" />
                        }
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-hot-600 max-w-[200px] truncate font-bold">
                        {log.input_text}
                      </td>
                      <td className="px-4 py-3 max-w-[300px] truncate">
                        {log.output_text || (
                          <span className="text-hot-500 text-xs italic">{log.error_message}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.model_used && (
                          <span className="font-mono px-2 py-0.5 bg-zap-100 border border-zap-300 rounded-md whitespace-nowrap">
                            {log.model_used}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-900/70 font-mono text-right tabular-nums">
                        {log.tokens_used ? log.tokens_used.toLocaleString() : '–'}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-900/60 font-mono">
                        {log.ip_address || '–'}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-900/60 whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Eye className="w-4 h-4 text-ink-900/30" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-icon py-2.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-display font-bold text-sm px-4 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-icon py-2.5 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// ============ Helpers ============
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function topModel(breakdown) {
  if (!breakdown || Object.keys(breakdown).length === 0) return '–';
  const [name, count] = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
  return `top: ${name} (${count})`;
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d trước`;
  return d.toLocaleString('vi-VN');
}

// ============ Stat Card ============
function StatCard({ icon, label, value, sub, variant }) {
  const variants = {
    lime: 'bg-lime-100 border-ink-900',
    pink: 'bg-hot-100 border-ink-900',
    zap:  'bg-zap-100 border-ink-900',
    lav:  'bg-lav-100 border-ink-900',
  };
  const iconBg = {
    lime: 'bg-lime-300',
    pink: 'bg-hot-300',
    zap:  'bg-zap-300 text-white',
    lav:  'bg-lav-200',
  };
  return (
    <div className={`${variants[variant]} border-[3px] rounded-2xl shadow-brutal p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`${iconBg[variant]} w-10 h-10 rounded-xl border-[2.5px] border-ink-900 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="font-display font-bold text-2xl sm:text-3xl text-ink-900 leading-none mt-2">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider font-display font-bold text-ink-900/70 mt-1">
        {label}
      </div>
      {sub && (
        <div className="text-xs text-ink-900/55 mt-1 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

// ============ Mobile log card ============
function LogCardMobile({ log, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left card-soft p-4 hover:bg-cream-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {log.success
            ? <CheckCircle2 className="w-4 h-4 text-lime-500" />
            : <XCircle className="w-4 h-4 text-hot-500" />
          }
          <span className="text-xs text-ink-900/60">{formatTime(log.created_at)}</span>
        </div>
        {log.tokens_used && (
          <span className="text-[10px] font-mono text-ink-900/60">
            {log.tokens_used.toLocaleString()} tok
          </span>
        )}
      </div>
      <div className="font-mono text-xs font-bold text-hot-600 mb-1 truncate">
        "{log.input_text}"
      </div>
      <div className="text-sm text-ink-900/80 truncate">
        {log.output_text || (
          <span className="text-hot-500 text-xs italic">{log.error_message}</span>
        )}
      </div>
      {log.model_used && (
        <div className="mt-2">
          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-zap-100 border border-zap-300 rounded">
            {log.model_used}
          </span>
        </div>
      )}
    </button>
  );
}

// ============ Detail modal ============
function LogDetailModal({ log, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="panel max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            {log.success ? (
              <span className="sticker-lime">
                <CheckCircle2 className="w-3.5 h-3.5" />
                thành công
              </span>
            ) : (
              <span className="sticker-pink">
                <XCircle className="w-3.5 h-3.5" />
                thất bại
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon py-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Input */}
          <Field label="input (slang)" mono>
            <div className="font-mono text-base font-bold text-hot-600 break-all">
              {log.input_text}
            </div>
          </Field>

          {/* Output / Error */}
          {log.success ? (
            <Field label="output (tiếng việt)">
              <div className="font-display text-lg font-semibold text-ink-900">
                {log.output_text}
              </div>
            </Field>
          ) : (
            <Field label="error">
              <div className="text-sm text-hot-600 italic">
                {log.error_message || 'unknown error'}
              </div>
            </Field>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-dashed border-ink-900/15">
            <MetaItem label="model" value={log.model_used || '–'} mono />
            <MetaItem label="tokens" value={log.tokens_used ? log.tokens_used.toLocaleString() : '–'} mono />
            <MetaItem label="ip" value={log.ip_address || '–'} mono />
            <MetaItem label="time" value={new Date(log.created_at).toLocaleString('vi-VN')} />
          </div>

          {log.user_agent && (
            <Field label="user agent">
              <div className="font-mono text-[11px] text-ink-900/60 break-all">
                {log.user_agent}
              </div>
            </Field>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-display font-bold text-ink-900/60 mb-1.5">
        {label}
      </div>
      <div className={`bg-cream-100 border-2 border-ink-900/15 rounded-xl p-3 ${mono ? 'font-mono' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-display font-bold text-ink-900/60 mb-0.5">
        {label}
      </div>
      <div className={`text-sm font-medium text-ink-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}
