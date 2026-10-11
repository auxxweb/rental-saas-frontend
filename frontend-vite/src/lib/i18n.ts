import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en/common.json'
import ar from '@/locales/ar/common.json'
import enShop from '@/locales/en/shop.json'
import arShop from '@/locales/ar/shop.json'

const resources = {
  en: { common: en, shop: enShop },
  ar: { common: ar, shop: arShop },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'shop'],
    defaultNS: 'shop',
    interpolation: { escapeValue: false },
  })
}

export default i18n
