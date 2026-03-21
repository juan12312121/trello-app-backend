import { Router } from 'express';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { upload }        from '../../config/multer.js';
import {
  getAttachments,
  postAttachment,
  downloadAttachment,
  deleteAttachment_,
} from './attachments.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(isBoardMember);

// Middleware que maneja errores de multer
const handleUpload = (req, res, next) => {
  upload.single('archivo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, message: 'El archivo supera el límite de 10MB' });
      }
      return res.status(400).json({ ok: false, message: err.message });
    }
    next();
  });
};

router.get('/',                          getAttachments);
router.post('/',           handleUpload, postAttachment);
router.get('/:attachmentId/download',    downloadAttachment);
router.delete('/:attachmentId',          deleteAttachment_);

export default router;