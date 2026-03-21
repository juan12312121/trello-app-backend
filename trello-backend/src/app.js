import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import { testConnection } from './config/database.js';

import attachmentRoutes from './modules/attachments/attachments.routes.js';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import authRoutes  from './modules/auth/auth.routes.js';
import boardRoutes from './modules/boards/boards.routes.js';
import listRoutes  from './modules/lists/lists.routes.js';
import cardRoutes from './modules/cards/cards.routes.js';
import { getMeAssignedCards } from './modules/cards/cards.controller.js';
import memberRoutes    from './modules/members/members.routes.js';
import commentRoutes   from './modules/comments/comments.routes.js';
import checklistRoutes from './modules/checklists/checklists.routes.js';
import tagRoutes from './modules/tags/tags.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import { getMeActivity } from './modules/activity/activity.controller.js';
import { globalInvitationRouter, boardInvitationRouter } from './modules/invitations/invitations.routes.js';

import reminderRoutes    from './modules/reminders/reminders.routes.js';
import chatRoutes        from './modules/chat/chat.routes.js';
import { saveMessage, toggleReaction } from './modules/chat/chat.service.js';
import { protect }       from './middlewares/auth.js';
import { getPendingReminders } from './modules/reminders/reminders.controller.js';


app.use('/api/v1/boards/:boardId/lists/:listId/cards/:cardId/attachments', attachmentRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({extended: true}));

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5000, // <--- Relajado enormemente para desarrollo
    message: {ok: false, message: 'Demasiadas solicitudes, por favor intenta de nuevo más tarde.'},
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

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
app.use('/api/v1/boards/:boardId/invitations', boardInvitationRouter);
app.use('/api/v1/boards/:boardId/lists/:listId/cards/:cardId/reminders', reminderRoutes);
app.use('/api/v1/boards/:boardId/messages', chatRoutes);

app.use('/api/v1/invitations', globalInvitationRouter);


app.get('/api/v1/reminders/pending', protect, getPendingReminders);
app.get('/api/v1/activity/me',      protect, getMeActivity);
app.get('/api/v1/cards/assigned/me',protect, getMeAssignedCards);





import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: '*' }
});

// Track users in boards
const boardUsers = new Map(); // boardId -> Set of userId

io.on('connection', (socket) => {
  let currentBoard = null;
  let currentUser = null;

  socket.on('join_board', ({ boardId, userId, userName }) => {
    socket.join(`board_${boardId}`);
    currentBoard = boardId;
    currentUser = { userId, userName };

    if (!boardUsers.has(boardId)) boardUsers.set(boardId, new Map());
    boardUsers.get(boardId).set(socket.id, { userId, userName });

    // Enviar lista actualizada de presentes
    const users = Array.from(boardUsers.get(boardId).values());
    io.to(`board_${boardId}`).emit('board:presence', users);
    
    console.log(`User ${userName} joined board_${boardId}`);
  });

  socket.on('leave_board', (boardId) => {
    socket.leave(`board_${boardId}`);
    if (boardUsers.has(boardId)) {
      boardUsers.get(boardId).delete(socket.id);
      const users = Array.from(boardUsers.get(boardId).values());
      io.to(`board_${boardId}`).emit('board:presence', users);
    }
    console.log(`Socket ${socket.id} left board_${boardId}`);
  });

  socket.on('board:typing', ({ boardId, userName }) => {
    socket.to(`board_${boardId}`).emit('board:typing', { userName });
  });

  socket.on('board:stop_typing', ({ boardId, userName }) => {
    socket.to(`board_${boardId}`).emit('board:stop_typing', { userName });
  });

  socket.on('board:message', async (msg) => {
    try {
      const savedId = await saveMessage(msg.boardId, msg.userId, msg.text);
      const broadcast = { ...msg, id: savedId, timestamp: new Date(), reactions: [] };
      io.to(`board_${msg.boardId}`).emit('board:message', broadcast);
    } catch (err) {
      console.error('Error guardando mensaje de chat:', err);
    }
  });

  socket.on('board:reaction', async (data) => {
    try {
      // data: { boardId, messageId, userId, emoji }
      const res = await toggleReaction(data.messageId, data.userId, data.emoji);
      // Notificar a todos en el tablero para actualizar sus mensajes
      io.to(`board_${data.boardId}`).emit('board:reaction_update', {
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
        action: res.action
      });
    } catch (err) {
      console.error('Error procesando reacción:', err);
    }
  });

  socket.on('disconnect', () => {
    if (currentBoard && boardUsers.has(currentBoard)) {
      boardUsers.get(currentBoard).delete(socket.id);
      const users = Array.from(boardUsers.get(currentBoard).values());
      io.to(`board_${currentBoard}`).emit('board:presence', users);
    }
  });
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

server.listen(PORT, async () => {
    console.log(`Servidor de API y WebSockets corriendo en puerto ${PORT}`);
    await testConnection();
});

export default app;
