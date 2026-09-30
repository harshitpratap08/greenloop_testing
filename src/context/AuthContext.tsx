import React, { createContext, useContext, useState } from 'react';

export type Role = 'provider' | 'receiver';

export interface User {
  email: string;
  name?: string;
  organization?: string;
  location?: string;
  vat?: string;
  phone?: string;
  receiverId?: string;
  workspaces: Role[];
  activeWorkspace?: Role;
}

interface AccountProfile {
  name?: string;
  organization?: string;
  location?: string;
  vat?: string;
  phone?: string;
  receiverId?: string;
  workspaces: Role[];
}

interface AuthContextType {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string, remember: boolean) => boolean;
  createAccount: (user: Pick<User, 'email' | 'name' | 'organization'>, password: string) => boolean;
  resetPassword: (email: string, password: string) => boolean;
  simulateGoogleLogin: () => boolean;
  addWorkspaces: (roles: Role[]) => void;
  setActiveWorkspace: (role: Role) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const profileKey = (email: string) => `gl_profile_${normalizeEmail(email)}`;
const passwordKey = (email: string) => `gl_password_${normalizeEmail(email)}`;
const isRole = (value: unknown): value is Role => value === 'provider' || value === 'receiver';

function readProfile(email: string): AccountProfile {
  const normalized = normalizeEmail(email);
  try {
    const saved = localStorage.getItem(profileKey(normalized));
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AccountProfile>;
      return {
        name: parsed.name,
        organization: parsed.organization,
        location: parsed.location,
        vat: parsed.vat,
        phone: parsed.phone,
        receiverId: parsed.receiverId,
        workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces.filter(isRole) : [],
      };
    }
  } catch {
    // Ignore malformed local demo profile data and fall back to legacy keys.
  }

  let workspaces: Role[] = [];
  try {
    const stored = localStorage.getItem(`gl_workspaces_${normalized}`);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) workspaces = parsed.filter(isRole);
  } catch {
    workspaces = [];
  }
  return {
    name: localStorage.getItem(`gl_name_${normalized}`) || undefined,
    organization: localStorage.getItem(`gl_org_${normalized}`) || undefined,
    workspaces,
  };
}

function readUser(email: string): User {
  const normalized = normalizeEmail(email);
  const profile = readProfile(normalized);
  const storedActive = localStorage.getItem(`gl_active_${normalized}`);
  const activeWorkspace = isRole(storedActive) ? storedActive : undefined;
  return { email: normalized, ...profile, activeWorkspace };
}

function saveProfile(user: User) {
  const profile: AccountProfile = {
    name: user.name,
    organization: user.organization,
    location: user.location,
    vat: user.vat,
    phone: user.phone,
    receiverId: user.receiverId,
    workspaces: user.workspaces,
  };
  localStorage.setItem(profileKey(user.email), JSON.stringify(profile));
  localStorage.setItem(`gl_workspaces_${user.email}`, JSON.stringify(user.workspaces));
  if (user.name !== undefined) localStorage.setItem(`gl_name_${user.email}`, user.name);
  if (user.organization !== undefined) localStorage.setItem(`gl_org_${user.email}`, user.organization);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedEmail = localStorage.getItem('gl_session_email') || sessionStorage.getItem('gl_session_email');
    return storedEmail ? readUser(storedEmail) : null;
  });
  const ready = true;

  const login = (email: string, password: string, remember: boolean) => {
    const normalized = normalizeEmail(email);
    const storedPassword = localStorage.getItem(passwordKey(normalized));
    if (!normalized || !storedPassword || storedPassword !== password) return false;

    localStorage.removeItem('gl_session_email');
    sessionStorage.removeItem('gl_session_email');
    const sessionStorageTarget = remember ? localStorage : sessionStorage;
    sessionStorageTarget.setItem('gl_session_email', normalized);
    setUser(readUser(normalized));
    return true;
  };

  const createAccount = (details: Pick<User, 'email' | 'name' | 'organization'>, password: string) => {
    const normalized = normalizeEmail(details.email);
    if (!normalized || localStorage.getItem(passwordKey(normalized))) return false;

    const newUser: User = {
      email: normalized,
      name: details.name?.trim(),
      organization: details.organization?.trim(),
      workspaces: [],
    };
    localStorage.setItem(passwordKey(normalized), password);
    saveProfile(newUser);
    localStorage.setItem('gl_session_email', normalized);
    sessionStorage.removeItem('gl_session_email');
    setUser(newUser);
    return true;
  };

  const resetPassword = (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    if (!normalized || !localStorage.getItem(passwordKey(normalized))) return false;
    localStorage.setItem(passwordKey(normalized), password);
    return true;
  };

  const simulateGoogleLogin = () => {
    const email = "google-user@example.com";
    const storedPassword = localStorage.getItem(passwordKey(email));
    return storedPassword
      ? login(email, storedPassword, true)
      : createAccount({ email, name: "Google Demo User", organization: "GreenLoop Demo" }, "greenloop-local-demo");
  };

  const addWorkspaces = (roles: Role[]) => {
    if (!user) return;
    const validRoles = roles.filter(isRole);
    const savedProfile = readProfile(user.email);
    const newWorkspaces = Array.from(new Set([...savedProfile.workspaces, ...validRoles]));
    const savedActive = localStorage.getItem(`gl_active_${user.email}`);
    const activeWorkspace = isRole(savedActive) && newWorkspaces.includes(savedActive)
      ? savedActive
      : validRoles[0] || newWorkspaces[0];
    const updated = { ...user, ...savedProfile, workspaces: newWorkspaces, activeWorkspace };
    if (activeWorkspace) localStorage.setItem(`gl_active_${user.email}`, activeWorkspace);
    saveProfile(updated);
    setUser((current) => current ? { ...current, workspaces: newWorkspaces, activeWorkspace } : current);
  };

  const setActiveWorkspace = (role: Role) => {
    if (!user) return;
    const savedProfile = readProfile(user.email);
    if (!user.workspaces.includes(role) && !savedProfile.workspaces.includes(role)) return;
    localStorage.setItem(`gl_active_${user.email}`, role);
    setUser((current) => current ? { ...current, activeWorkspace: role } : current);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...readProfile(user.email), ...updates };
    saveProfile(updated);
    setUser((current) => current ? { ...current, ...updates } : current);
  };

  const logout = () => {
    localStorage.removeItem('gl_session_email');
    sessionStorage.removeItem('gl_session_email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, createAccount, resetPassword, simulateGoogleLogin, addWorkspaces, setActiveWorkspace, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
