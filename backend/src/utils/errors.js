class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function sendError(res, status, code, message) {
  return res.status(status).json({ ok: false, error: { code, message } });
}

function sendSuccess(res, status, data) {
  return res.status(status).json({ ok: true, ...data });
}

module.exports = { AppError, sendError, sendSuccess };
