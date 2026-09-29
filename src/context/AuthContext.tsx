import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'provider' | 'receiver';

export interface User {
  email: string;
  name?: string;
  organization?: string;
  workspaces: Role[];
  activeWorkspace?: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  addWorkspaces: (roles: Role[]) => void;
  setActiveWorkspace: (role: Role) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const storedEmail = localStorage.getItem('gl_session_email');
    if (storedEmail) {
      const workspacesStr = localStorage.getItem(`gl_workspaces_${storedEmail}`);
      const workspaces = workspacesStr ? JSON.parse(workspacesStr) : [];
      const activeWorkspace = localStorage.getItem(`gl_active_${storedEmail}`) as Role | undefined;
      const name = localStorage.getItem(`gl_name_${storedEmail}`) || undefined;
      const organization = localStorage.getItem(`gl_org_${storedEmail}`) || undefined;
      setUser({ email: storedEmail, workspaces, activeWorkspace: activeWorkspace || undefined, name, organization });
    }
  }, []);

  const login = (email: string) => {
    localStorage.setItem('gl_session_email', email);
    const workspacesStr = localStorage.getItem(`gl_workspaces_${email}`);
    const workspaces = workspacesStr ? JSON.parse(workspacesStr) : [];
    const activeWorkspace = localStorage.getItem(`gl_active_${email}`) as Role | undefined;
    const name = localStorage.getItem(`gl_name_${email}`) || undefined;
    const organization = localStorage.getItem(`gl_org_${email}`) || undefined;
    setUser({ email, workspaces, activeWorkspace: activeWorkspace || undefined, name, organization });
  };

  const addWorkspaces = (roles: Role[]) => {
    if (user) {
      const newWorkspaces = Array.from(new Set([...user.workspaces, ...roles]));
      localStorage.setItem(`gl_workspaces_${user.email}`, JSON.stringify(newWorkspaces));
      
      const newActive = user.activeWorkspace || roles[0];
      localStorage.setItem(`gl_active_${user.email}`, newActive);

      setUser({ ...user, workspaces: newWorkspaces, activeWorkspace: newActive });
    }
  };

  const setActiveWorkspace = (role: Role) => {
    if (user) {
      localStorage.setItem(`gl_active_${user.email}`, role);
      setUser({ ...user, activeWorkspace: role });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      if (updates.name) localStorage.setItem(`gl_name_${user.email}`, updates.name);
      if (updates.organization) localStorage.setItem(`gl_org_${user.email}`, updates.organization);
      setUser(updated);
    }
  };

  const logout = () => {
    localStorage.removeItem('gl_session_email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, addWorkspaces, setActiveWorkspace, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
