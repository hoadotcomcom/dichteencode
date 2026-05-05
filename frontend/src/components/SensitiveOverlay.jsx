import { useState } from 'react';
import { EyeOff, Eye, AlertTriangle } from 'lucide-react';

/**
 * Facebook-style sensitive content overlay.
 *
 * Hiển thị nội dung bị blur + warning. User phải click "xem nội dung"
 * để reveal. Mỗi instance độc lập (không persist) — mỗi lần dịch mới
 * sẽ che lại.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - nội dung cần che
 * @param {string[]} props.labels - nhãn loại nội dung nhạy cảm (vd: ['chửi thề'])
 */
export default function SensitiveOverlay({ children, labels = [] }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      {/* The actual content — always rendered, blurred when not revealed */}
      <div
        className={
          revealed
            ? 'transition-[filter] duration-300'
            : 'pointer-events-none select-none blur-2xl scale-[1.02] transition-[filter] duration-300'
        }
        aria-hidden={!revealed}
      >
        {children}
      </div>

      {/* Overlay — covers content when not revealed */}
      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900/60 backdrop-blur-sm rounded-xl border-2 border-ink-900 cursor-pointer hover:bg-ink-900/70 transition-colors group"
          aria-label="Hiển thị nội dung nhạy cảm"
        >
          <div className="w-12 h-12 rounded-full bg-cream-50 border-2 border-ink-900 flex items-center justify-center shadow-brutal-sm">
            <AlertTriangle className="w-6 h-6 text-hot-500" />
          </div>

          <div className="text-center px-4">
            <p className="font-display font-bold text-white text-base sm:text-lg leading-tight">
              Nội dung nhạy cảm
            </p>
            {labels.length > 0 && (
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Có thể chứa: {labels.join(', ')}
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-ink-900 font-semibold text-sm rounded-full border-2 border-ink-900 shadow-brutal-sm group-hover:-translate-y-0.5 group-hover:shadow-brutal transition-all">
            <Eye className="w-4 h-4" />
            xem nội dung
          </div>
        </button>
      )}

      {/* Hide button (only when revealed) */}
      {revealed && (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-ink-900 text-xs font-semibold rounded-full border-2 border-ink-900 shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal transition-all"
          aria-label="Ẩn lại nội dung"
        >
          <EyeOff className="w-3 h-3" />
          ẩn lại
        </button>
      )}
    </div>
  );
}
