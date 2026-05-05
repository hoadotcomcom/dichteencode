import TranslateBox from '../components/TranslateBox';
import BlogSection from '../components/BlogSection';
import { Sparkles, Heart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmosphere — colored blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] bg-hot-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-40 -right-32 w-[480px] h-[480px] bg-zap-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] bg-lime-200 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Grid paper */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-paper bg-grid-md opacity-60"
      />

      {/* Floating decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute top-24 left-[8%] animate-float">
          <div className="sticker-lime tilt-l-3 text-base">✦ no cap</div>
        </div>
        <div className="absolute top-32 right-[10%] animate-float" style={{ animationDelay: '1.2s' }}>
          <div className="sticker-pink tilt-r-3 text-base">slay 💅</div>
        </div>
        <div className="absolute top-[55%] left-[5%] animate-float" style={{ animationDelay: '2.4s' }}>
          <div className="sticker-zap tilt-l text-base">fr fr</div>
        </div>
        <div className="absolute top-[60%] right-[6%] animate-float" style={{ animationDelay: '0.6s' }}>
          <div className="sticker-lav tilt-r text-base">based ✨</div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 sticker-lime tilt-l-3 mb-6 animate-bounce-in">
            <Sparkles className="w-4 h-4" />
            <span>genz → tiếng việt chuẩn</span>
          </div>

          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-balance leading-[0.95] mb-6">
              <span className="inline-block animate-slide-up">dịch </span>{' '}
            <span className="inline-block animate-slide-up" style={{ animationDelay: '0.1s' }}>
              teencode
            </span>{' '}
            <span
              className="inline-block animate-slide-up relative"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="relative z-10 squiggle">siêu nhanh</span>
              <span
                aria-hidden
                className="absolute -inset-2 bg-hot-300 -z-0 -rotate-2 rounded-2xl"
              />
            </span>
            <span className="text-hot-400">?</span>
          </h1>

          <p
            className="max-w-xl mx-auto text-lg md:text-xl text-ink-900/70 font-medium animate-slide-up"
            style={{ animationDelay: '0.35s' }}
          >
            Dán slang vào, tụi mình dịch sang tiếng Việt người lớn —{' '}
            <span className="bg-lime-200 px-1.5 rounded-md">đầy đủ, không lọc</span>.
          </p>
        </div>

        {/* Translation tool */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <TranslateBox />
        </div>

        {/* Blog — SEO content for "teencode" + LSI keywords */}
        <BlogSection />

        {/* Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink-900/15 rounded-full text-sm text-ink-900/70">
            <Heart className="w-4 h-4 fill-hot-400 text-hot-400" />
            <span>built for ba mẹ — không lưu nội dung cá nhân</span>
          </div>
        </div>
      </div>
    </div>
  );
}
