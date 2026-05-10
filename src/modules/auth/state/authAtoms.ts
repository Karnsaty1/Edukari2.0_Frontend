import { atom, selector } from 'recoil';
import { decodeJwtPayload } from '../../../utils/jwt';
import { readTokens, writeTokens, clearTokens, resolveExpiryMs } from '../tokenStorage';

const isExpired = (expiresAtMs) => {
  const expiryMs = resolveExpiryMs(expiresAtMs);
  if (!expiryMs) return true;
  return Date.now() >= Number(expiryMs);
};

export const tokensAtom = atom({
  key: 'auth.tokens',
  default: readTokens(),
  effects_UNSTABLE: [
    ({ onSet, setSelf }) => {
      // Hydrate from sessionStorage on init (in case module was evaluated before storage was ready).
      setSelf(readTokens());

      onSet((newValue) => {
        if (newValue) writeTokens(newValue);
        else clearTokens();
      });
    },
  ],
});

const PROFILE_KEY = 'edukari_profile_v1';

const readProfile = () => {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const writeProfile = (profile: any) => {
  try {
    if (profile) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else sessionStorage.removeItem(PROFILE_KEY);
  } catch {}
};

export const profileAtom = atom({
  key: 'auth.profile',
  default: readProfile(),
  effects_UNSTABLE: [
    ({ onSet, setSelf }) => {
      setSelf(readProfile());
      onSet((newValue) => writeProfile(newValue));
    },
  ],
});

export const userSelector = selector({
  key: 'auth.user',
  get: ({ get }) => {
    const tokens = get(tokensAtom);
    if (!tokens?.accessToken) return null;
    return decodeJwtPayload(tokens.accessToken);
  },
});

export const isAuthedSelector = selector({
  key: 'auth.isAuthed',
  get: ({ get }) => {
    const tokens = get(tokensAtom);
    const user = get(userSelector);
    if (!tokens?.accessToken || !tokens?.refreshToken || !user) return false;
    return !isExpired(tokens.accessTokenExpiresAt) && !isExpired(tokens.refreshTokenExpiresAt);
  },
});

export const accessTokenSelector = selector({
  key: 'auth.accessToken',
  get: ({ get }) => {
    const tokens = get(tokensAtom);
    if (!tokens?.accessToken) return '';
    if (isExpired(tokens.accessTokenExpiresAt)) return '';
    return tokens.accessToken;
  },
});

export const authSnapshotSelector = selector({
  key: 'auth.snapshot',
  get: ({ get }) => ({
    tokens: get(tokensAtom),
    user: get(userSelector),
    isAuthed: get(isAuthedSelector),
    profile: get(profileAtom),
  }),
});
