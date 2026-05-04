import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { useAuth } from '../modules/auth';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
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
      navigate('/');
    } catch (err) {
      setError(err?.code === 'MISSING_API_BASE_URL' ? 'Server is not configured yet.' : 'Request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <PageHero
        kicker={mode === 'login' ? 'Login' : 'Create Account'}
        title={mode === 'login' ? 'Welcome back' : 'Create your account'}
        description={mode === 'login' ? 'Sign in with email and password.' : 'Create your Edukari account with your first and last name.'}
        primaryAction={{ label: 'Go Dashboard', to: '/' }}
        secondaryAction={{ label: 'Open Courses', to: '/courses' }}
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
              <p className="mt-2 text-blue-700">
                {mode === 'login' ? 'Welcome back to Edukari.' : 'Create your account in a minute.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode((current) => (current === 'login' ? 'signup' : 'login'));
              }}
              className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 transition-colors"
            >
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <form onSubmit={onPasswordLogin} className="mt-6">
            <div className="grid gap-4">
              {mode === 'signup' ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-sm font-semibold text-blue-900">First name</div>
                    <input
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      type="text"
                      autoComplete="given-name"
                      required={mode === 'signup'}
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Satyam"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-blue-900">Last name</div>
                    <input
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      type="text"
                      autoComplete="family-name"
                      required={mode === 'signup'}
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Karn"
                    />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <div className="text-sm font-semibold text-blue-900">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <div className="text-sm font-semibold text-blue-900">Password</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Your password"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy || !apiBase}
              className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:hover:bg-blue-600"
            >
              {busy ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>

            {!apiBase ? (
              <p className="mt-3 text-sm text-blue-700/90">Email/password auth will be enabled when the server is connected.</p>
            ) : null}
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-blue-100"></div>
            <div className="text-sm font-semibold text-blue-700">OR</div>
            <div className="h-px flex-1 bg-blue-100"></div>
          </div>

          <div className="mt-6">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={(res) => {
                  if (res?.credential) {
                    api
                      .loginWithGoogle({ credential: res.credential })
                      .then(() => navigate('/'))
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
              <button
                type="button"
                disabled
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 font-semibold text-blue-900 opacity-70"
              >
                Continue with Google (not configured)
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
