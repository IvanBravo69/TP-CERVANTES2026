const { serverError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con ese valor único',
    });
  }

  serverError(res, process.env.NODE_ENV === 'production' ? 'Error interno' : err.message);
};
