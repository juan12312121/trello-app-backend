import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { validate }      from '../../middlewares/validate.js';
import {
  getReminders,
  getPendingReminders,
  postReminder,
  patchReminder,
  deleteReminder_,
} from './reminders.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(isBoardMember);

const reminderRules = [
  body('fecha_recordatorio')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Formato inválido — usa YYYY-MM-DD HH:MM:SS')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha debe ser en el futuro');
      }
      return true;
    }),
  body('tipo')
    .optional()
    .isIn(['email', 'notificacion', 'en_app']).withMessage('Tipo inválido'),
];

const patchReminderRules = [
  body('fecha_recordatorio')
    .optional()
    .isISO8601().withMessage('Formato inválido')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('La fecha debe ser en el futuro');
      }
      return true;
    }),
  body('tipo')
    .optional()
    .isIn(['email', 'notificacion', 'en_app']).withMessage('Tipo inválido'),
];

// ── Rutas de card ─────────────────────────────────────
router.get('/',                getReminders);
router.post('/',               reminderRules,      validate, postReminder);
router.patch('/:reminderId',   patchReminderRules, validate, patchReminder);
router.delete('/:reminderId',  deleteReminder_);

export default router;