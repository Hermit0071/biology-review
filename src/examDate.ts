import type { AppSettings } from './types'

export const SETTINGS_SCHEMA_VERSION = 2
export const LEGACY_DEFAULT_EXAM_DATE = '2026-07-04T10:30'

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function suggestedExamDate(now = new Date()) {
  let year = now.getFullYear()
  const candidate = () => {
    const date = new Date(year, 6, 1, 10, 30)
    date.setDate(1 + (6 - date.getDay() + 7) % 7)
    return date
  }
  let date = candidate()
  if (date.getTime() <= now.getTime()) {
    year += 1
    date = candidate()
  }
  return formatLocalDateTime(date)
}

export function createDefaultSettings(now = new Date()): AppSettings {
  return { examDate: suggestedExamDate(now), schemaVersion: SETTINGS_SCHEMA_VERSION }
}

export function migrateSettings(settings: AppSettings, now = new Date()): AppSettings {
  const examTime = new Date(settings.examDate).getTime()
  const shouldResetLegacyDefault = settings.examDate === LEGACY_DEFAULT_EXAM_DATE && examTime <= now.getTime()
  return {
    ...settings,
    examDate: shouldResetLegacyDefault ? suggestedExamDate(now) : settings.examDate,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
  }
}

export function isExamDateExpired(date: string, now = Date.now()) {
  const target = new Date(date).getTime()
  return !Number.isFinite(target) || target <= now
}
