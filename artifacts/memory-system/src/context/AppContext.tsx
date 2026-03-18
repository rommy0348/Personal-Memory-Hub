import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { ListMemoriesLibraryType, ChatResponse } from '@workspace/api-client-react';

export type Theme = 'dark' | 'light';

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  bio: string;
  language: 'zh' | 'en';
  fontSize: 'sm' | 'md' | 'lg';
  sendOnEnter: boolean;
}

const DEFAULT_API_SETTINGS: ApiSettings = {
  baseUrl: '',
  apiKey: '',
  model: 'gpt-5.2',
  enabled: false,
};

const DEFAULT_USER_PROFILE: UserProfile = {
  name: '用户',
  avatarUrl: '',
  bio: '',
  language: 'zh',
  fontSize: 'md',
  sendOnEnter: true,
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;

  libraryType: ListMemoriesLibraryType;
  setLibraryType: (type: ListMemoriesLibraryType) => void;

  selectedFolderId: number | null;
  setSelectedFolderId: (id: number | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
  togglePanel: () => void;

  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;

  activeSessionResponses: Record<number, ChatResponse>;
  addSessionResponse: (messageId: number, response: ChatResponse) => void;

  apiSettings: ApiSettings;
  setApiSettings: (settings: ApiSettings) => void;

  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;

  mobileTab: 'chat' | 'panel';
  setMobileTab: (tab: 'chat' | 'panel') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (load('ai-memory-theme', { theme: 'dark' }) as { theme: Theme }).theme);
  const [libraryType, setLibraryType] = useState<ListMemoriesLibraryType>('memory');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [sidebarWidth, setSidebarWidthState] = useState<number>(() => load<{ w: number }>('ai-memory-sidebar-width', { w: 380 }).w);
  const [activeSessionResponses, setActiveSessionResponses] = useState<Record<number, ChatResponse>>({});
  const [apiSettings, setApiSettingsState] = useState<ApiSettings>(() => load('ai-memory-api-settings', DEFAULT_API_SETTINGS));
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => load('ai-memory-user-profile', DEFAULT_USER_PROFILE));
  const [mobileTab, setMobileTab] = useState<'chat' | 'panel'>('chat');

  // Sync theme to <html> class
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
    save('ai-memory-theme', { theme });
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const togglePanel = () => setIsPanelOpen(prev => !prev);

  const setSidebarWidth = (w: number) => {
    setSidebarWidthState(w);
    save('ai-memory-sidebar-width', { w });
  };

  const setApiSettings = (settings: ApiSettings) => {
    setApiSettingsState(settings);
    save('ai-memory-api-settings', settings);
  };

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    save('ai-memory-user-profile', profile);
  };

  const addSessionResponse = (messageId: number, response: ChatResponse) => {
    setActiveSessionResponses(prev => ({ ...prev, [messageId]: response }));
  };

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      libraryType, setLibraryType,
      selectedFolderId, setSelectedFolderId,
      searchQuery, setSearchQuery,
      isPanelOpen, setIsPanelOpen, togglePanel,
      sidebarWidth, setSidebarWidth,
      activeSessionResponses, addSessionResponse,
      apiSettings, setApiSettings,
      userProfile, setUserProfile,
      mobileTab, setMobileTab,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
