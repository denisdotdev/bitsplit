'use client'

import { useLocale, type Locale } from '@/i18n/IntlProvider'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  const toggleLanguage = () => {
    const newLocale: Locale = locale === 'en' ? 'fr' : 'en'
    setLocale(newLocale)
  }

  return (
    <Button
      variant="ghost"
      onClick={toggleLanguage}
      className="flex items-center"
      title={locale === 'en' ? 'Switch to French' : 'Passer au français'}
    >
      <Globe className="h-4 w-4 mr-2" />
      {locale === 'en' ? 'FR' : 'EN'}
    </Button>
  )
}