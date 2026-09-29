import React from 'react'

const themes = {
    dark: {
      backgroundColor: '#0f1117',
      surfaceColor: 'rgba(26, 29, 39, 0.75)',
      elevatedColor: '#242836',
      secondaryColor: 'rgba(26, 29, 39, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#e8eaed',
      textSecondary: '#9aa0a8',
      color: '#e8eaed',
      accentGradient: 'linear-gradient(135deg, #6c63ff, #a855f7)',
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      glassBlur: '16px',
    },
    light: {
      backgroundColor: '#f0f2f5',
      surfaceColor: 'rgba(255, 255, 255, 0.65)',
      elevatedColor: '#f8f9fb',
      secondaryColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(0, 0, 0, 0.06)',
      textPrimary: '#1a1d27',
      textSecondary: '#5f6673',
      color: '#1a1d27',
      accentGradient: 'linear-gradient(135deg, #6c63ff, #a855f7)',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      glassBlur: '16px',
    }
}

const initialState = {
    dark: true,
    theme: themes.dark,
    toggle: () => {}
  }
const ThemeContext = React.createContext(initialState)

function ThemeProvider({ children }) {
  const [dark, setDark] = React.useState(true) // Default theme is dark

  // On mount, read the preferred theme from the persistence
  React.useEffect(() => {
    const isDark = localStorage.getItem('dark') === 'true'
    setDark(isDark)
  }, [dark])

  // To toggle between dark and light modes
  const toggle = () => {
    const isDark = !dark
    localStorage.setItem('dark', JSON.stringify(isDark))
    setDark(isDark)
  }

  const theme = dark ? themes.dark : themes.light

  return (
    <ThemeContext.Provider value={{ theme, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { ThemeProvider, ThemeContext }