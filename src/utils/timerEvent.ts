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
    const today = new Date()
    const dayOfWeek = today.getDay()

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)

    function formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day} 00:00:00`
    }
    return {
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek),
    }
  }

  static getLastWeekDate() {
    const today = new Date()
    const dayOfWeek = today.getDay()

    const startOfLastWeek = new Date(today)
    startOfLastWeek.setDate(today.getDate() - dayOfWeek - 6)

    const endOfLastWeek = new Date(startOfLastWeek)
    endOfLastWeek.setDate(endOfLastWeek.getDate() + 6)

    function formatDate(date: Date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day} 00:00:00`
    }

    return {
      start: formatDate(startOfLastWeek),
      end: formatDate(endOfLastWeek),
    }
  }

  static getMonthDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // Months are 0-based
    const dateStart = new Date(year, month - 1, 1)
    dateStart.setHours(0, 0, 0, 0)

    const dateEnd = new Date(year, month, 0) // Last day of the month
    dateEnd.setHours(23, 59, 59, 999)

    return [dateStart, dateEnd]
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
    const formattedYesterday = `${yesterday.getFullYear()}-${
                             (`0${yesterday.getMonth() + 1}`).slice(-2)}-${
                             (`0${yesterday.getDate()}`).slice(-2)} 00:00:00`

    return formattedYesterday
  }
}
