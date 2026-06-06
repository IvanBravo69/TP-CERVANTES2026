const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/response');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Token no proporcionado');
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    unauthorized(res, 'Token inválido o expirado');
  }
}

function authorize(...permisos) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);

    const userPermisos = req.user.permisos || [];
    const tiene = permisos.every((p) => userPermisos.includes(p));

    if (!tiene) return forbidden(res);
    next();
  };
}

module.exports = { authenticate, authorize };
