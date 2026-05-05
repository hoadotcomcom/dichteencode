import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, LogOut, Eye, EyeOff, FileText, Settings as SettingsIcon, Check, KeyRound } from 'lucide-react';
import { api } from '../lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [savedFlash, setSavedFlash] = useState({});
  const [error, setError]         = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const navigate = useNavigate();

  const token    = localStorage.getItem('admin_token');
  const username = localStorage.getItem('admin_username');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings(token);
      setSettings(data);
    } catch (err) {
      if (err.message.includes('401')) navigate('/admin/login');
      else setError(err.message || 'Không tải được settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving((s) => ({ ...s, [key]: true }));
    setError('');
    try {
      await api.updateSetting(token, key, value);
      setSavedFlash((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSavedFlash((s) => ({ ...s, [key]: false })), 1800);
      await loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới nhập lại chưa khớp nha');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await api.changePassword(
        token,
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordMessage(result.message || 'Đổi mật khẩu xong rồi nha ✨');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleShowSecret = (key) => {
    setShowSecrets((p) => ({ ...p, [key]: !p[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="panel p-8">
          <Loader2 className="w-8 h-8 animate-spin text-hot-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="absolute inset-0 bg-grid-paper bg-grid-md opacity-40 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="sticker-pink tilt-l-3 mb-3">
              <SettingsIcon className="w-3.5 h-3.5" />
              control room
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink-900">
              settings
            </h1>
            <p className="text-sm text-ink-900/60 mt-1">
              hi, <span className="font-bold text-ink-900">{username}</span> 👋
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/admin/logs" className="btn btn-ghost text-sm">
              <FileText className="w-4 h-4" />
              logs
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost text-sm">
              <LogOut className="w-4 h-4" />
              logout
            </button>
          </div>
        </div>

        {error && (
          <div className="panel-pink p-4 mb-5 animate-bounce-in">
            <p className="text-sm font-medium text-ink-900">{error}</p>
          </div>
        )}

        {passwordMessage && (
          <div className="panel-lime p-4 mb-5 animate-bounce-in">
            <p className="text-sm font-bold text-ink-900">{passwordMessage}</p>
          </div>
        )}

        {/* Change password */}
        <form onSubmit={handlePasswordChange} className="panel-zap p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zap-400 border-[2.5px] border-ink-900 flex items-center justify-center shadow-brutal-sm">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-ink-900">
                đổi mật khẩu admin
              </h2>
              <p className="text-xs text-ink-900/60">
                nên đổi định kỳ, và đừng dùng lại password cũ nha
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="input text-sm"
              placeholder="mật khẩu hiện tại"
              autoComplete="current-password"
              required
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="input text-sm"
              placeholder="mật khẩu mới (ít nhất 8 ký tự)"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="input text-sm"
              placeholder="nhập lại mật khẩu mới"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  đang đổi...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  đổi mật khẩu
                </>
              )}
            </button>
          </div>
        </form>

        {/* Settings list */}
        <div className="space-y-4">
          {settings.map((s) => {
            const isPrompt = s.key === 'translation_prompt';
            const isTwoFactorToggle = s.key === 'telegram_2fa_enabled';
            const isSaving = saving[s.key];
            const isSaved  = savedFlash[s.key];

            return (
              <div key={s.key} className="panel p-5 sm:p-6 transition-all">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <code className="font-mono font-bold text-sm bg-cream-100 px-2.5 py-1 rounded-lg border-2 border-ink-900/15">
                    {s.key}
                  </code>
                  {s.is_secret && (
                    <span className="sticker-pink py-0.5 px-2 text-[10px]">
                      🔒 secret
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-xs text-ink-900/50 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      saving
                    </span>
                  )}
                  {isSaved && (
                    <span className="text-xs text-lime-600 font-bold flex items-center gap-1 animate-bounce-in">
                      <Check className="w-3.5 h-3.5" />
                      saved
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="text-sm text-ink-900/60 mb-3">{s.description}</p>
                )}

                {isPrompt ? (
                  <textarea
                    defaultValue={s.value}
                    onBlur={(e) => {
                      if (e.target.value !== s.value) handleSave(s.key, e.target.value);
                    }}
                    rows={12}
                    className="input min-h-[260px] font-mono text-xs leading-relaxed"
                  />
                ) : isTwoFactorToggle ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 bg-cream-50 border-2 border-ink-900/15 rounded-2xl">
                    <div>
                      <p className="font-display font-bold text-ink-900">
                        Telegram 2FA đang {s.value === 'true' ? 'bật' : 'tắt'}
                      </p>
                      <p className="text-xs text-ink-900/60 mt-0.5">
                        Khi bật, admin phải nhập mã 6 số gửi qua Telegram mới login được.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSave(s.key, s.value === 'true' ? 'false' : 'true')}
                      disabled={isSaving}
                      className={s.value === 'true' ? 'btn btn-primary text-sm' : 'btn btn-ghost text-sm'}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          saving
                        </>
                      ) : s.value === 'true' ? 'tắt 2FA' : 'bật 2FA'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type={s.is_secret && !showSecrets[s.key] ? 'password' : 'text'}
                      defaultValue={s.value}
                      onBlur={(e) => {
                        if (e.target.value !== s.value) handleSave(s.key, e.target.value);
                      }}
                      className="input font-mono text-sm"
                    />
                    {s.is_secret && (
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(s.key)}
                        className="btn btn-ghost btn-icon py-3"
                      >
                        {showSecrets[s.key]
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tip card */}
        <div className="panel-zap p-5 mt-8">
          <p className="font-display font-bold text-ink-900 mb-1">💡 lưu ý</p>
          <ul className="text-sm text-ink-900/75 space-y-1 list-disc list-inside">
            <li>thay đổi auto-save khi rời ô input</li>
            <li>cấu hình <code className="font-mono">llm_api_key</code> + <code className="font-mono">llm_base_url</code> để kết nối proxy</li>
            <li>xem INTEGRATION.md để biết cách setup proxy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
