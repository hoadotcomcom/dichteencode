import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, ArrowRight, MessageCircle, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode]   = useState('');
  const [challenge, setChallenge] = useState(null);
  const [notice, setNotice]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login(username, password);
      if (result.access_token) {
        localStorage.setItem('admin_token', result.access_token);
        localStorage.setItem('admin_username', username);
        navigate('/admin/settings');
        return;
      }
      setChallenge(result);
      setPassword('');
      setOtpCode('');
      setNotice(result.message || 'Mã 6 số đã được gửi qua Telegram rồi nha ✨');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyLogin(challenge.challenge_id, otpCode);
      localStorage.setItem('admin_token', result.access_token);
      localStorage.setItem('admin_username', username);
      navigate('/admin/settings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setChallenge(null);
    setOtpCode('');
    setNotice('');
    setError('');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-zap-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-hot-200 rounded-full blur-3xl opacity-50" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-grid-paper bg-grid-md opacity-50" />

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Floating sticker */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
          <div className="sticker-zap tilt-l-3 text-sm animate-bounce-in">
            🔐 admin only
          </div>
        </div>

        <div className="panel p-8 animate-slide-up">
          <div className="text-center mb-7 mt-2">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-zap-400 border-[3px] border-ink-900 shadow-brutal items-center justify-center mb-4 -rotate-6">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-ink-900">
              {challenge ? 'nhập mã 2FA' : 'welcome back'}
            </h1>
            {challenge && (
              <p className="text-sm text-ink-900/60 mt-1">
                check Telegram bot rồi nhập mã 6 số
              </p>
            )}
          </div>

          {!challenge ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-ink-900/70 mb-1.5">
                  username
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-ink-900/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input pl-11"
                    placeholder="admin"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-ink-900/70 mb-1.5">
                  password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-ink-900/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-11"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-hot-100 border-[2.5px] border-ink-900 rounded-xl text-sm font-medium text-ink-900 shadow-brutal-sm animate-bounce-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    đang xác thực...
                  </>
                ) : (
                  <>
                    Xác thực
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {notice && (
                <div className="p-3 bg-lime-100 border-[2.5px] border-ink-900 rounded-xl text-sm font-bold text-ink-900 shadow-brutal-sm animate-bounce-in">
                  {notice}
                </div>
              )}

              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-ink-900/70 mb-1.5">
                  mã 6 số
                </label>
                <div className="relative">
                  <MessageCircle className="w-5 h-5 text-ink-900/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input pl-11 font-mono text-2xl tracking-[0.35em] text-center"
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-ink-900/55 mt-2">
                  mã hết hạn sau {Math.floor((challenge.expires_in || 300) / 60)} phút
                </p>
              </div>

              {error && (
                <div className="p-3 bg-hot-100 border-[2.5px] border-ink-900 rounded-xl text-sm font-medium text-ink-900 shadow-brutal-sm animate-bounce-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    đang xác thực...
                  </>
                ) : (
                  <>
                    xác thực & vào admin
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetLogin}
                className="btn btn-ghost w-full text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                nhập lại username/password
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
