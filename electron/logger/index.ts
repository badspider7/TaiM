import util from 'node:util'
import path from 'node:path'
import winston, { format } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { app } from 'electron'
import type { TransformableInfo } from 'logform'

const isDev = !!process.env.VITE_DEV_SERVER_URL

// https://github.com/winstonjs/winston/issues/1427
function combineMessageAndSplat() {
  return {
    transform(info: TransformableInfo) {
      const { [Symbol.for('splat')]: args = [], message } = info
      info.message = util.format(message, ...args)
      return info
    },
  }
}

function createLogger() {
  return winston.createLogger({
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      combineMessageAndSplat(),
      format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
    ),
  })
}

const logDirPath = isDev ? '.' : app.getPath('userData')
console.log('app===', app.getPath('userData'))

const dailyRotateFileTransport = new DailyRotateFile({
  level: isDev ? 'debug' : 'info',
  filename: path.join(logDirPath, 'logs/application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
})

const dailyRotateFileTransport2 = new DailyRotateFile({
  level: 'error',
  filename: path.join(logDirPath, 'logs/application-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
})

const logger = createLogger()
logger.add(dailyRotateFileTransport)
logger.add(dailyRotateFileTransport2)
if (isDev) {
  logger.add(
    new winston.transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
    }),
  )
}

export default logger
