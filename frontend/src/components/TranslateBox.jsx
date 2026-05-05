import { useState, useMemo } from 'react';
import { Loader2, Sparkles, AlertCircle, ArrowRight, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import { detectSensitive } from '../lib/sensitiveWords';
import SensitiveOverlay from './SensitiveOverlay';

const EXAMPLES = [
  { input: 'j z tr',     output: 'Gì vậy trời' },
  { input: 'đc r',       output: 'Được rồi' },
  { input: 'chằm zn',    output: 'Trầm cảm (than vãn nhẹ)' },
  { input: 'ét o ét',    output: 'SOS — kêu cứu hài hước' },
  { input: 'u là zời',   output: 'Biểu cảm ngạc nhiên' },
  { input: 'mlem',       output: 'Ngon, hấp dẫn' },
];

export default function TranslateBox() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) {
      setError('Nhập slang vào trước đã 👀');
      return;
    }
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const result = await api.translate(input);
      setOutput(result.translated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const tryExample = (ex) => {
    setInput(ex.input);
    setOutput('');
    setError('');
  };

  // Detect nội dung nhạy cảm — recompute mỗi khi output đổi
  const sensitivity = useMemo(() => detectSensitive(output), [output]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Input panel */}
      <div className="relative panel p-6 sm:p-8">
        {/* Corner sticker */}
        <div className="absolute -top-4 -left-3 sticker-pink tilt-l-3">
          step 1 · paste slang
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="vd: tml ntn r"
          rows={4}
          maxLength={300}
          className="input font-mono text-lg leading-relaxed resize-none mt-2"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-ink-900/60 font-medium">
            <span className="font-mono">{input.length}/300</span>
            <span className="hidden sm:inline">·</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-cream-100 border-2 border-ink-900/15 rounded-md font-mono text-xs">
              ⌘ + ↵
            </kbd>
            <span className="hidden sm:inline">để dịch nhanh</span>
          </div>

          <button
            onClick={handleTranslate}
            disabled={loading || !input.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brutal text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                đang dịch...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                dịch ngay
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="panel-pink p-5 animate-bounce-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-hot-400 border-[2.5px] border-ink-900 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="font-display font-bold text-ink-900">oops</p>
              <p className="text-sm text-ink-900/80 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="relative panel-lime p-6 sm:p-8 animate-bounce-in">
          <div className="absolute -top-4 -right-3 sticker-zap tilt-r-3">
            ✓ done
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-display font-bold text-ink-900/70 uppercase tracking-wider">
                <span className="inline-block w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                tiếng việt chuẩn
              </div>
              {!sensitivity.sensitive && (
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white border-[2.5px] border-ink-900 rounded-xl shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-lime-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-ink-900" />
                  )}
                </button>
              )}
            </div>

            {sensitivity.sensitive ? (
              <SensitiveOverlay labels={sensitivity.labels}>
                <div className="relative bg-white/40 rounded-xl p-4 min-h-[120px]">
                  <p className="font-display text-2xl sm:text-3xl font-semibold leading-snug text-ink-900 text-balance pr-12">
                    {output}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-white border-[2.5px] border-ink-900 rounded-xl shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-lime-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-ink-900" />
                    )}
                  </button>
                </div>
              </SensitiveOverlay>
            ) : (
              <p className="font-display text-2xl sm:text-3xl font-semibold leading-snug text-ink-900 text-balance">
                {output}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="relative panel-cream p-6 sm:p-8">
        <div className="absolute -top-4 -right-3 sticker-lav tilt-r-3">
          step 2 · thử ngay
        </div>

        <h3 className="font-display font-bold text-lg mb-4 text-ink-900 mt-2">
          ví dụ phổ biến — bấm để xài
        </h3>

        <div className="grid sm:grid-cols-2 gap-3">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => tryExample(ex)}
              className="group text-left p-3 bg-white border-[2.5px] border-ink-900 rounded-2xl shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 hover:bg-cream-100 active:translate-y-0 active:shadow-none transition-all"
            >
              <div className="font-mono text-sm font-bold text-hot-500">
                "{ex.input}"
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-900/60">
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{ex.output}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-sm text-ink-900/55 px-4">
        ⚠️ một số từ khá thô — tụi mình dịch trung thực để ba mẹ hiểu chính xác con đang nói gì
      </div>
    </div>
  );
}
