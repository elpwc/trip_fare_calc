'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/src/utils/auth-provider';

const languageOptions = ['简体中文', 'English', '日本語', '한국어'];

export default function UserPage() {
  const { user, loading, error, login, register, logout, changePassword, updateName, updateEmail, registerEmail } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [message, setMessage] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      await login(email, password);
      setAuthMode(null);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致');
      return;
    }

    if (!code) {
      setMessage('请填写邮箱验证码');
      return;
    }

    try {
      await register(email, name, password, code);
      setAuthMode(null);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleSendCode = async () => {
    setMessage('');
    try {
      await registerEmail(email);
      setMessage('验证码已发送，请查收邮箱。');
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-245 mx-auto px-4 pb-28 pt-5">
        {loading ? (
          <div className="rounded-4xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">正在加载用户信息...</p>
          </div>
        ) : !user ? (
          <div className="rounded-4xl bg-white p-6 shadow-2xl shadow-slate-200 dark:bg-slate-950 dark:shadow-slate-900/30">
            <div className="text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">欢迎使用旅行账单助手</p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">请先登录或注册，保存你的个人设置和账单数据。</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setMessage('');
                }}
                className="rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setMessage('');
                }}
                className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                注册
              </button>
            </div>

            {authMode ? (
              <form className="mt-6 space-y-4" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">邮箱</label>
                  <input
                    value={email}
                    type="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                {authMode === 'register' ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">验证码</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={code}
                        type="text"
                        onChange={(event) => setCode(event.target.value)}
                        placeholder="请输入验证码"
                        className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        className="rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        发送
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">验证码会发送到你的邮箱，24小时内有效。</p>
                  </div>
                ) : null}

                {authMode === 'register' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">用户名</label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">密码</label>
                  <input
                    value={password}
                    type="password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                {authMode === 'register' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">确认密码</label>
                    <input
                      value={confirmPassword}
                      type="password"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                ) : null}

                {message ? <p className="text-sm text-rose-500">{message}</p> : null}
                {error ? <p className="text-sm text-rose-500">{error}</p> : null}

                <div className="flex flex-wrap justify-between gap-3">
                  <button
                    type="submit"
                    className="w-full max-w-30 rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {authMode === 'login' ? '登录' : '确认注册'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : (
          <>
            <header className="overflow-hidden rounded-4xl bg-linear-to-br from-sky-600 via-indigo-600 to-violet-700 p-5 shadow-2xl shadow-slate-900/20 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-3xl font-semibold leading-tight">{user.name}</p>
                  <p className="mt-2 text-sm text-sky-100/80">注册邮箱：{user.email}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg shadow-slate-900/10 transition hover:bg-white/20"
                  aria-label="修改名字"
                  onClick={async () => {
                    const newName = window.prompt('请输入新的用户名', user.name);
                    if (newName && newName !== user.name) {
                      try {
                        await updateName(newName);
                        setMessage('姓名已更新');
                      } catch (err) {
                        setMessage((err as Error).message);
                      }
                    }
                  }}
                >
                  编辑
                </button>
              </div>
            </header>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={async () => {
                  const newEmail = window.prompt('请输入新的邮箱地址', user.email);
                  if (newEmail && newEmail !== user.email) {
                    try {
                      await updateEmail(newEmail);
                      setMessage('邮箱已更新');
                    } catch (err) {
                      setMessage((err as Error).message);
                    }
                  }
                }}
              >
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">修改邮箱</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">当前邮箱：{user.email}</p>
                </div>
                <span className="text-slate-400">›</span>
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={async () => {
                  const oldPassword = window.prompt('请输入当前密码');
                  const newPassword = window.prompt('请输入新密码');
                  if (!oldPassword || !newPassword) {
                    return;
                  }
                  try {
                    await changePassword(oldPassword, newPassword);
                    setMessage('密码已修改，请妥善保存');
                  } catch (err) {
                    setMessage((err as Error).message);
                  }
                }}
              >
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">修改密码</p>
                </div>
                <span className="text-slate-400">›</span>
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-slate-900 dark:text-slate-100">主题</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">明亮 / 夜间 / 跟随系统</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['light', 'dark', 'system'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setThemeMode(mode)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          themeMode === mode
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        {mode === 'light' ? '明亮' : mode === 'dark' ? '夜间' : '跟随系统'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-slate-900 dark:text-slate-100">语言</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">选择你的界面语言</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {languageOptions.map((language) => (
                    <button
                      key={language}
                      type="button"
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">疑问与反馈</p>
                </div>
                <span className="text-slate-400">›</span>
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">关于</p>
                </div>
                <span className="text-slate-400">›</span>
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-3xl bg-rose-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
