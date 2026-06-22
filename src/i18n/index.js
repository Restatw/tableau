import { createI18n } from 'vue-i18n'
import en   from './locales/en.js'
import zhTW from './locales/zh-TW.js'
import zhCN from './locales/zh-CN.js'

// Map app locale key → Univer LocaleType string
export const UNIVER_LOCALE_MAP = {
  en:   'enUS',
  zhTW: 'zhTW',
  zhCN: 'zhCN',
}

export const i18n = createI18n({
  legacy: false,          // use Composition API mode
  locale: 'en',          // default
  fallbackLocale: 'en',
  messages: { en, zhTW, zhCN },
})
