'use client'

import { IntlProvider as ReactIntlProvider } from 'react-intl'
import { createContext, useContext, useState, useEffect } from 'react'

import enMessages from './messages/en.json'
import frMessages from './messages/fr.json'

const messages = {
  en: enMessages,
  fr: frMessages
}

export type Locale = keyof typeof messages

interface IntlContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const IntlContext = createContext<IntlContextType>({
  locale: 'en',
  setLocale: () => {}
})

export const useLocale = () => useContext(IntlContext)

interface IntlProviderProps {
  children: React.ReactNode
}

export default function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && messages[savedLocale]) {
      setLocale(savedLocale)
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <IntlContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      <ReactIntlProvider
        locale={locale}
        messages={messages[locale]}
        defaultLocale="en"
      >
        {children}
      </ReactIntlProvider>
    </IntlContext.Provider>
  )
}