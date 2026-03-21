import multer from 'multer';
import path   from 'path';
import { v4 as uuidv4 } from 'uuid';

// Tipos de archivo permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
];

// Guardar en disco local (carpeta uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // la carpeta debe existir
  },
  filename: (req, file, cb) => {
    // uuid + extensión original — evita colisiones y caracteres raros
    const ext      = path.extname(file.originalname);
    const filename = uuidv4() + ext;
    cb(null, filename);
  },
});

// Filtro de tipos
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10 MB máximo
  },
});