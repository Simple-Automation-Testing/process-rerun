class ProcessRerunError extends Error {
  constructor(type, message) {
    super(message);
    this.name = `${type}${this.constructor.name}`;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ProcessRerunError };
