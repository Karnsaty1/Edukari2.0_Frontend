import { useEffect, useMemo } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { authSnapshotSelector, profileAtom, tokensAtom, userSelector, isAuthedSelector } from '../state/authAtoms';
import { getMe, loginWithGoogleCredential, loginWithPassword, registerWithPassword, refreshSession } from '../authApi';
import { resolveExpiryMs } from '../tokenStorage';

const isExpired = (expiresAtMs) => {
  const expiryMs = resolveExpiryMs(expiresAtMs);
  if (!expiryMs) return true;
  return Date.now() >= Number(expiryMs);
};

let refreshInFlight = null;

export const useAuth = () => {
  const [tokens, setTokens] = useRecoilState(tokensAtom);
  const user = useRecoilValue(userSelector);
  const isAuthed = useRecoilValue(isAuthedSelector);
  const profile = useRecoilValue(profileAtom);
  const setProfile = useSetRecoilState(profileAtom);
  const snapshot = useRecoilValue(authSnapshotSelector);

  const setAndPersistTokens = (nextTokens) => setTokens(nextTokens);
  const logout = () => {
    setProfile(null);
    setAndPersistTokens(null);
  };

  const loadProfile = async (accessToken) => {
    if (!accessToken) return null;
    try {
      const me = await getMe({ accessToken });
      setProfile(me);
      return me;
    } catch {
      setProfile(null);
      return null;
    }
  };

  const refresh = async () => {
    const current = tokens;
    if (!current?.refreshToken) throw new Error('Missing refresh token');
    if (isExpired(current.refreshTokenExpiresAt)) throw new Error('Refresh token expired');

    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const nextTokens = await refreshSession({ refreshToken: current.refreshToken });
        // Backend should rotate refresh token and invalidate the old one.
        setAndPersistTokens(nextTokens);
        await loadProfile(nextTokens.accessToken);
        return nextTokens;
      } catch (e) {
        logout();
        throw e;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  };

  // Proactive refresh: attempt a refresh ~2 minutes before access expiry.
  useEffect(() => {
    if (!tokens?.accessToken || !tokens?.accessTokenExpiresAt) return;
    const msUntil = Number(tokens.accessTokenExpiresAt) - Date.now();
    const fireIn = Math.max(5_000, msUntil - 2 * 60 * 1000);
    const id = setTimeout(() => {
      refresh().catch(() => {});
    }, fireIn);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken, tokens?.accessTokenExpiresAt, tokens?.refreshToken]);

  return useMemo(() => {
    const api = {
      loginWithPassword: async ({ email, password }) => {
        const nextTokens = await loginWithPassword({ email, password });
        setAndPersistTokens(nextTokens);
        await loadProfile(nextTokens.accessToken);
        return nextTokens;
      },
      registerWithPassword: async ({ firstname, lastname, email, password }) => {
        const nextTokens = await registerWithPassword({ firstname, lastname, email, password });
        setAndPersistTokens(nextTokens);
        await loadProfile(nextTokens.accessToken);
        return nextTokens;
      },
      loginWithGoogle: async ({ credential }) => {
        const nextTokens = await loginWithGoogleCredential({ credential });
        setAndPersistTokens(nextTokens);
        await loadProfile(nextTokens.accessToken);
        return nextTokens;
      },
      refresh,
      logout,
      loadProfile,
    };

    return {
      tokens,
      user,
      isAuthed,
      profile,
      authSnapshot: snapshot,
      api,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, user, isAuthed, profile, snapshot]);
};
