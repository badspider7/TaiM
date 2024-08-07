export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} 00:00:00`
}

export class Time {
  static toHoursString(seconds) {
    const hours = seconds / 3600
    if (hours > 0.1) {
      return hours.toFixed(2)
    }
    else {
      return '0'
    }
  }

  static toString(seconds) {
    let minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 1) {
      return `${seconds}秒`
    }

    const hours = Math.floor(minutes / 60)
    minutes %= 60

    if (hours > 0) {
      return `${hours}小时${(minutes > 0 ? `${minutes}分钟` : '')}${(remainingSeconds > 0 ? `${remainingSeconds}秒` : '')}`
    }
    else {
      return `${minutes}分钟${(remainingSeconds > 0 ? `${remainingSeconds}秒` : '')}`
    }
  }

  static getThisWeekDate() {
    const now = new Date()
    const day = now.getDay()

    const start = new Date(
      now.getTime() - (day === 0 ? 6 : day - 1) * 24 * 60 * 60 * 1000,
    )

    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
    return {
      start: formatDate(start),
      end: formatDate(end),
    }
  }

  static getLastWeekDate() {
    const now = new Date()
    const day = now.getDay()

    const thisWeekStart = new Date(
      now.getTime() - (day === 0 ? 6 : day - 1) * 24 * 60 * 60 * 1000,
    )

    const lastWeekStart = new Date(
      thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
    )

    const lastWeekEnd = new Date(
      lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
    )

    return {
      start: formatDate(lastWeekStart),
      end: formatDate(lastWeekEnd),
    }
  }

  static getBoforeLastWeekDate() {
    const now = new Date()
    const day = now.getDay()

    const thisWeekStart = new Date(
      now.getTime() - (day === 0 ? 6 : day - 1) * 24 * 60 * 60 * 1000,
    )

    const lastTwoWeeksStart = new Date(
      thisWeekStart.getTime() - 2 * 7 * 24 * 60 * 60 * 1000,
    )

    const lastTwoWeeksEnd = new Date(
      lastTwoWeeksStart.getTime() + 6 * 24 * 60 * 60 * 1000,
    )

    return {
      start: formatDate(lastTwoWeeksStart),
      end: formatDate(lastTwoWeeksEnd),
    }
  }

  static getMonthDate(month: number) {
    const year = new Date().getFullYear()
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay),
    }
  }

  static getYearDate(date) {
    const year = date.getFullYear()
    const dateStart = new Date(year, 0, 1) // January 1st
    dateStart.setHours(0, 0, 0, 0)

    const dateEnd = new Date(year + 1, 0, 1) // January 1st of next year
    dateEnd.setHours(0, 0, 0, -1) // Subtract 1 millisecond to get last millisecond of the year

    return [dateStart, dateEnd]
  }

  static getYesterdayDate() {
    const today = new Date()
    const oneDay = 24 * 60 * 60 * 1000
    const yesterday = new Date(today.getTime() - oneDay)
    const formattedYesterday = `${yesterday.getFullYear()}-${(`0${yesterday.getMonth() + 1}`).slice(-2)}-${(`0${yesterday.getDate()}`).slice(-2)} 00:00:00`

    return formattedYesterday
  }
}
