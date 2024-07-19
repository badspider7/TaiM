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
    const weekStartDate = new Date(today)
    weekStartDate.setDate(weekStartDate.getDate() - dayOfWeek + 1)
    weekStartDate.setHours(0, 0, 0, 0) // Reset time to start of day

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999) // Set time to end of day

    return [weekStartDate, weekEndDate]
  }

  static getLastWeekDate() {
    const [start, end] = Time.getThisWeekDate()
    const lastWeekStartDate = new Date(start)
    lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7)
    const lastWeekEndDate = new Date(end)
    lastWeekEndDate.setDate(lastWeekEndDate.getDate() - 7)

    return [lastWeekStartDate, lastWeekEndDate]
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
}

// Example usage
// console.log(Time.toHoursString(3661)) // Should print "1.02"
// console.log(Time.toString(3661)) // Should print "2分钟3秒"
// console.log(Time.getThisWeekDate()) // Prints current week's start and end dates
// console.log(Time.getLastWeekDate()) // Prints last week's start and end dates
// console.log(Time.getMonthDate(new Date())) // Prints current month's start and end dates
// console.log(Time.getYearDate(new Date())) // Prints current year's start and end dates
