'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">

        <Link href="/" className="flex items-center gap-2 justify-center mb-8 font-bold text-xl">
          <Zap className="w-6 h-6 text-sky-400" />
          Content<span className="text-sky-400">AI</span>
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Tạo tài khoản miễn phí</h1>
          <p className="text-slate-400 text-sm mb-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-sky-400 hover:underline">Đăng nhập</Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* Free plan badge */}
          <div className="flex items-center gap-3 bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3 mb-6 text-sm">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-sky-300">Miễn phí 10 lượt tạo nội dung — không cần thẻ ngân hàng</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Họ tên</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} required
                placeholder="Nguyễn Văn A"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required
                  placeholder="Ít nhất 6 ký tự"
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo tài khoản...</> : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
