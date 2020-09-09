function wrapInGreen(txt: string): string {
  return `\u001b[34m${txt}\u001b[0m`;
}

function wrapInRed(txt: string): string {
  return `\u001b[31m${txt}\u001b[0m`;
}

function wrapInBlue(txt: string): string {
  return `\u001b[34m${txt}\u001b[0m`;
}

function wrapInYellow(txt: string): string {
  return `\u001b[33m${txt}\u001b[0m`;
}

function wrapInMagenta(txt: string): string {
  return `\x1b[35m${txt}\u001b[0m`;
}

const colors = {
  red: (text: string) => wrapInRed(text),
  magenta: (text: string) => wrapInMagenta(text),
  green: (text: string) => wrapInGreen(text),
  yellow: (text: string) => wrapInYellow(text),
  blue: (text: string) => wrapInBlue(text)
};

const logger = {
  // 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE';
  logLevel: 'ERROR',
  log(...args) {
    if (this.logLevel === 'VERBOSE') {
      console.log(colors.green('LOG: '), ...args);
    }
  },
  info(...args) {
    if (this.logLevel === 'VERBOSE' || this.logLevel === 'INFO') {
      console.info(colors.yellow('INFO: '), ...args);
    }
  },
  warn(...args) {
    if (this.logLevel === 'VERBOSE' || this.logLevel === 'INFO' || this.logLevel === 'WARN') {

      console.warn(colors.magenta('WARNING: '), ...args);
    }
  },
  error(...args) {
    if (this.logLevel === 'VERBOSE' || this.logLevel === 'INFO' || this.logLevel === 'WARN' || this.logLevel === 'ERROR') {
      console.error(colors.red('ERROR: '), ...args);
    }
  },
  setLogLevel(level) {
    this.logLevel = level;
  }
};


function setLogLevel(level: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE') {
  logger.setLogLevel(level);
}

export {
  logger,
  colors,
  setLogLevel
}