import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { api } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [mode, setMode] = useState('login');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Visiting /login should always start from a clean session.
    api.logout();
    setMode('login');
    setFirstname('');
    setLastname('');
    setEmail('');
    setPassword('');
    setBusy(false);
    setError('');
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-6">
        <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-blue-900">Preparing login...</div>
          <p className="mt-2 text-sm text-blue-700">Clearing previous session.</p>
        </div>
      </div>
    );
  }

  const onPasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await api.loginWithPassword({ email, password });
      } else {
        await api.registerWithPassword({ firstname, lastname, email, password });
      }
      const next = searchParams.get('next');
      navigate(next || '/');
    } catch (err) {
      setError(err?.code === 'MISSING_API_BASE_URL' ? 'Server is not configured yet.' : 'Request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Floating orbs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-blue-400/30 blur-3xl animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-orb-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full bg-yellow-300/10 blur-2xl animate-orb-3 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo + tagline */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="text-5xl font-bold text-white tracking-tight">
            Edu<span className="text-yellow-300">kari</span>
          </div>
          <p className="mt-2 text-blue-100 text-sm">
            {mode === 'login' ? 'Sign in to continue learning' : 'Start your learning journey'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up-delay1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-blue-900">{mode === 'login' ? 'Sign In' : 'Sign Up'}</h2>
            <button
              type="button"
              onClick={() => { setError(''); setMode((m) => m === 'login' ? 'signup' : 'login'); }}
              className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 transition-colors"
            >
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={onPasswordLogin} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-sm font-semibold text-blue-900 mb-1">First name</div>
                  <input
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    type="text"
                    autoComplete="given-name"
                    required
                    className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="First name"
                  />
                </label>
                <label className="block">
                  <div className="text-sm font-semibold text-blue-900 mb-1">Last name</div>
                  <input
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    type="text"
                    autoComplete="family-name"
                    required
                    className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Last name"
                  />
                </label>
              </div>
            )}

            <label className="block">
              <div className="text-sm font-semibold text-blue-900 mb-1">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-blue-900 mb-1">Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Your password"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60 animate-pulse-glow"
            >
              {busy ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-blue-100" />
            <span className="text-sm font-semibold text-blue-400">OR</span>
            <div className="h-px flex-1 bg-blue-100" />
          </div>

          <div>
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={(res) => {
                  if (res?.credential) {
                    api.loginWithGoogle({ credential: res.credential })
                      .then(() => {
                        const next = searchParams.get('next');
                        navigate(next || '/');
                      })
                      .catch(() => setError('Google sign-in failed. Please try again.'));
                  }
                }}
                onError={() => setError('Google sign-in failed. Please try again.')}
                useOneTap
                theme="outline"
                size="large"
                shape="pill"
              />
            ) : (
              <button type="button" disabled className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 font-semibold text-blue-400">
                Continue with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
