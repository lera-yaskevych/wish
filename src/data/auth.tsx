import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { forgetPush } from '@/lib/push';

import { api, type Api, type User } from './index';

type AuthValue = {
  user: User | null;
  // False until the saved session has been checked on launch.
  ready: boolean;
  signUp: Api['signUp'];
  logIn: Api['logIn'];
  logOut: Api['logOut'];
  requestPasswordReset: Api['requestPasswordReset'];
  setPassword: Api['setPassword'];
  updateProfile: Api['updateProfile'];
};

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      signUp: async (input) => {
        const next = await api.signUp(input);
        queryClient.clear();
        setUser(next);
        return next;
      },
      logIn: async (input) => {
        const next = await api.logIn(input);
        queryClient.clear();
        setUser(next);
        return next;
      },
      logOut: async () => {
        await forgetPush().catch(() => {});
        await api.logOut();
        setUser(null);
        queryClient.clear();
      },
      requestPasswordReset: api.requestPasswordReset,
      setPassword: api.setPassword,
      updateProfile: async (patch) => {
        const next = await api.updateProfile(patch);
        setUser(next);
        await queryClient.invalidateQueries();
        return next;
      },
    }),
    [user, ready, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};

// For screens that only render once someone is signed in.
export const useMe = () => {
  const { user } = useAuth();
  if (!user) throw new Error('useMe used while signed out');
  return user;
};
