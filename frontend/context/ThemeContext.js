import React from 'react'

const themes = {
    dark: {
      backgroundColor: '#1a1a2e',
      surfaceColor: '#16213e',
      elevatedColor: '#0f3460',
      secondaryColor: '#0f3460',
      borderColor: '#000000',
      textPrimary: '#ffffff',
      textSecondary: '#b8c1d0',
      color: '#ffffff',
      accentColor: '#ff6b6b',
      shadowColor: '#000000',
    },
    light: {
      backgroundColor: '#f5f0e8',
      surfaceColor: '#ffffff',
      elevatedColor: '#fff8e7',
      secondaryColor: '#fff8e7',
      borderColor: '#000000',
      textPrimary: '#1a1a2e',
      textSecondary: '#4a4a6a',
      color: '#1a1a2e',
      accentColor: '#ff6b6b',
      shadowColor: '#000000',
    }
}

const initialState = {
    dark: false,
    theme: themes.light,
    toggle: () => {}
  }
const ThemeContext = React.createContext(initialState)

function ThemeProvider({ children }) {
  const [dark, setDark] = React.useState(false) // Default theme is light for neo-brutalism

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