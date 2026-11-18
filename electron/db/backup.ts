import type { AppModel, HoursLogModels } from '../type/types'
import { type WebsiteHour, normalizeWebUrl } from '../browser/tracking'

export interface Category {
  id: number
  name: string
}
export interface Backup {
  format: 'taim-backup'
  version: 1
  exportedAt: string
  apps: AppModel[]
  hours: HoursLogModels[]
  categories: Category[]
  websites?: WebsiteHour[]
}

export function validateBackup(value: unknown): Backup {
  const v = value as Backup
  const fail = () => {
    throw new Error('备份格式错误或存在无效数据，原数据未修改')
  }
  if (!v || v.format !== 'taim-backup' || v.version !== 1 || !Array.isArray(v.apps) || !Array.isArray(v.hours) || !Array.isArray(v.categories))
    return fail()
  const ids = new Set<number>()
  const names = new Set<string>()
  const categories = new Set<number>([0])
  const categoryNames = new Set<string>()
  for (const c of v.categories) {
    if (!c || !Number.isSafeInteger(c.id) || c.id <= 0 || categories.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 40 || categoryNames.has(c.name))
      return fail()
    categories.add(c.id)
    categoryNames.add(c.name)
  }
  for (const a of v.apps) {
    if (!a || !Number.isSafeInteger(a.id) || a.id! <= 0 || ids.has(a.id!) || names.has(a.name)
      || ['name', 'alias', 'description', 'file', 'iconFile'].some(k => typeof a[k as keyof AppModel] !== 'string')
      || !a.name.trim() || !categories.has(a.categoryId)) {
      return fail()
    }
    ids.add(a.id!)
    names.add(a.name)
  }
  const buckets = new Set<string>()
  for (const h of v.hours) {
    if (!h || !ids.has(h.appModelId) || !Number.isFinite(h.time) || h.time < 0 || h.time > Number.MAX_SAFE_INTEGER
      || typeof h.hoursTime !== 'string' || !/^\d{4}-\d{2}-\d{2} (?:[01]\d|2[0-3]):00:00$/.test(h.hoursTime)) {
      return fail()
    }
    const date = new Date(`${h.hoursTime.slice(0, 10)}T12:00:00Z`)
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== h.hoursTime.slice(0, 10))
      return fail()
    const key = `${h.appModelId}/${h.hoursTime}`
    if (buckets.has(key))
      return fail()
    buckets.add(key)
  }
  if (v.websites !== undefined && !Array.isArray(v.websites))
    return fail()
  const websiteBuckets = new Set<string>()
  for (const w of v.websites ?? []) {
    if (!w || !['chrome', 'edge'].includes(w.browser) || typeof w.url !== 'string'
      || typeof w.title !== 'string' || w.title.length > 512 || !Number.isFinite(w.time) || w.time < 0 || w.time > Number.MAX_SAFE_INTEGER
      || typeof w.hoursTime !== 'string' || !/^\d{4}-\d{2}-\d{2} (?:[01]\d|2[0-3]):00:00$/.test(w.hoursTime)) {
      return fail()
    }
    try {
      const normalized = normalizeWebUrl(w.url)
      if (normalized.url !== w.url || normalized.domain !== w.domain)
        return fail()
      const date = new Date(`${w.hoursTime.slice(0, 10)}T12:00:00Z`)
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== w.hoursTime.slice(0, 10))
        return fail()
    }
    catch { return fail() }
    const key = JSON.stringify([w.browser, w.url, w.hoursTime])
    if (websiteBuckets.has(key))
      return fail()
    websiteBuckets.add(key)
  }
  return v
}

export function csvCell(value: unknown) {
  let text = String(value ?? '')
  // Prevent spreadsheet formulas when opening exports in Excel.
  if (/^\s*[=+@-]/.test(text))
    text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
