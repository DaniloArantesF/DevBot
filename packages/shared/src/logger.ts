import { TBot } from "./bot";

class Logger {
  logLevel: TBot.LogLevel;
  constructor(level:TBot.LogLevel) {
    this.logLevel = level;
  }

  Header(rows: string[], level: TBot.LogLevel) {
    const margin = 4;
    const width = Math.max(...rows.map((row) => row.length)) + margin * 2;

    console.log(
      `%c
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
      'background: #222; color: #bada55',
    );
  }

  Info(message: string) {
    if (this.logLevel === 'minimal') return;
    console.log(`%c  ${message}`, 'color: #bada55');
  }

  Warning(module: string, message: string) {
    console.log(`%c  [${module}]: ${message}`, 'color: #f0ad4e');
  }

  Debug(module: string, message: string) {
    console.log(`%c  [${module}]: ${message}`, 'color: #5bc0de');
  }

  Error(module: string, message: string) {
    console.log(`%c  [${module}]: ${message}`, 'color: #ff0111');
  }
}

const logger = new Logger('debug');
export {logger};
