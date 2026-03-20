import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import { testConnection } from './config/database.js';
const app = express();


import authRoutes  from './modules/auth/auth.routes.js';
import boardRoutes from './modules/boards/boards.routes.js';
import listRoutes  from './modules/lists/lists.routes.js';
import cardRoutes from './modules/cards/cards.routes.js';
import memberRoutes    from './modules/members/members.routes.js';
import commentRoutes   from './modules/comments/comments.routes.js';
import checklistRoutes from './modules/checklists/checklists.routes.js';
import tagRoutes from './modules/tags/tags.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';





app.use(helmet());
app.use(xss());
app.use(hpp());


app.use(cors({
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máx. 100 solicitudes por IP
    message: {ok: false, message: 'Demasiadas solicitudes, por favor intenta de nuevo más tarde.'},
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({extended: true}));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/v1/auth',   authRoutes);
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/boards/:boardId/lists', listRoutes);
app.use('/api/v1/boards/:boardId/lists/:listId/cards', cardRoutes);
app.use('/api/v1/boards/:boardId/members',                              memberRoutes);
app.use('/api/v1/boards/:boardId/lists/:listId/cards/:cardId/comments', commentRoutes);
app.use('/api/v1/boards/:boardId/lists/:listId/cards/:cardId/checklists', checklistRoutes);
app.use('/api/v1/boards/:boardId/tags', tagRoutes);
app.use('/api/v1/boards/:boardId/activity', activityRoutes);





app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, async () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    await testConnection();
});

export default app;
