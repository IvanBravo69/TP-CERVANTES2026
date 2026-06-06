const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middlewares/validate');
const { loginHandler } = require('./auth.controller');

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('username requerido'),
    body('password').notEmpty().withMessage('password requerido'),
  ],
  validate,
  loginHandler
);

module.exports = router;
