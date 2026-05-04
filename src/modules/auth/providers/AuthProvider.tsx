import { RecoilRoot } from 'recoil';

export const AuthProvider = ({ children }) => {
  return <RecoilRoot>{children}</RecoilRoot>;
};
