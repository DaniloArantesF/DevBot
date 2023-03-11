import { TBot } from './bot';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

class Logger {
  logLevel: TBot.LogLevel;
  constructor(level: TBot.LogLevel) {
    this.logLevel = level;
  }

  Header(rows: string[]) {
    const margin = 4;
    const width = Math.max(...rows.map((row) => row.length)) + margin * 2;

    console.log(
      `${colors.cyan}
    ${'#'.repeat(width)}
    #${' '.repeat(width - 2)}#
    ${rows
      .map((row) => {
        const marginLeft = Math.ceil((width - row.length) / 2) - 1;
        const marginRight = Math.floor((width - row.length) / 2) - 1;
        return `#${' '.repeat(marginLeft)}${row}${' '.repeat(marginRight)}#`;
      })
      .join('\n    ')}
    #${' '.repeat(width - 2)}#
    ${'#'.repeat(width)}
    `,
    );
  }

  Info(module: string, message: string) {
    if (this.logLevel === 'minimal') return;
    console.log(`${colors.green}[INFO:${module}]${colors.reset} ${message}`);
  }

  Warning(module: string, message: string) {
    console.log(`${colors.yellow}[WARNING:${module}]${colors.reset} ${message}`);
  }

  Debug(module: string, message: string) {
    console.log(`${colors.magenta}[DEBUG:${module}]${colors.reset} ${message}`);
  }

  Error(module: string, message: string) {
    console.log(`${colors.red}[ERROR:${module}]${colors.reset} ${message}`);
  }
}

const logger = new Logger('debug');
export { logger };
