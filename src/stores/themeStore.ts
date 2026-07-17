import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolvedTheme: 'light' | 'dark') {
  const root = document.documentElement
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize from localStorage, default to 'system'
  const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
  const resolvedTheme = getResolvedTheme(savedTheme)
  
  // Apply theme immediately
  applyTheme(resolvedTheme)

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const state = get()
      if (state.theme === 'system') {
        const newResolved = getSystemTheme()
        applyTheme(newResolved)
        set({ resolvedTheme: newResolved })
      }
    }
    mediaQuery.addEventListener('change', handleChange)
  }

  return {
    theme: savedTheme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme)
      const resolvedTheme = getResolvedTheme(theme)
      applyTheme(resolvedTheme)
      set({ theme, resolvedTheme })
    },
    toggleTheme: () => {
      const state = get()
      // If currently system, switch to opposite of system
      // If manually set, toggle between light and dark
      const currentResolved = state.resolvedTheme
      const newResolved: 'light' | 'dark' = currentResolved === 'light' ? 'dark' : 'light'
      const newTheme: Theme = newResolved
      
      localStorage.setItem('theme', newTheme)
      applyTheme(newResolved)
      set({ theme: newTheme, resolvedTheme: newResolved })
    },
  }
})