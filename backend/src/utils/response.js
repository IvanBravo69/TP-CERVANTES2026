const ok = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Recurso creado') =>
  ok(res, data, message, 201);

const fail = (res, message = 'Error', statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

const notFound = (res, message = 'Recurso no encontrado') =>
  fail(res, message, 404);

const unauthorized = (res, message = 'No autorizado') =>
  fail(res, message, 401);

const forbidden = (res, message = 'Acceso denegado') =>
  fail(res, message, 403);

const serverError = (res, message = 'Error interno del servidor') =>
  fail(res, message, 500);

module.exports = { ok, created, fail, notFound, unauthorized, forbidden, serverError };
