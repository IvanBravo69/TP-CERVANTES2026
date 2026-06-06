const { login } = require('./auth.service');
const { ok, fail } = require('../../utils/response');

async function loginHandler(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    ok(res, result, 'Login exitoso');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

module.exports = { loginHandler };
