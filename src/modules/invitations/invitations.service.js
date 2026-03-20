import pool from '../../config/database.js';

// ── Crear invitación ───────────────────────────────────
export const createInvitation = async ({ boardId, invitadoPor, email, rol }) => {
  // Buscar si el usuario existe en el sistema
  const [users] = await pool.execute(
    'SELECT id FROM users WHERE email = ?', [email]
  );
  const invitadoId = users[0]?.id ?? null;

  // Verificar que no sea miembro ya
  if (invitadoId) {
    const [existing] = await pool.execute(
      'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, invitadoId]
    );
    if (existing.length > 0) {
      return { error: 'El usuario ya es miembro de este tablero' };
    }
  }

  // Verificar que no exista una invitación pendiente
  const [pendientes] = await pool.execute(
    `SELECT id FROM board_invitations 
     WHERE board_id = ? AND invitado_email = ? AND estado = 'pendiente'`,
    [boardId, email]
  );
  if (pendientes.length > 0) {
    return { error: 'Ya existe una invitación pendiente para este usuario' };
  }

  // Si el usuario no existe en el sistema, no se puede invitar
  if (!invitadoId) {
    return { error: 'No se encontró un usuario registrado con ese correo' };
  }

  // Crear la invitación
  const [result] = await pool.execute(`
    INSERT INTO board_invitations (board_id, invitado_por, invitado_email, invitado_id, rol)
    VALUES (?, ?, ?, ?, ?)
  `, [boardId, invitadoPor, email, invitadoId, rol]);

  // Devolver la invitación completa
  const [inv] = await pool.execute(`
    SELECT 
      bi.id, bi.board_id, bi.invitado_email, bi.rol, bi.estado, bi.fecha_creacion,
      b.nombre AS board_nombre,
      u.nombre AS invitador_nombre
    FROM board_invitations bi
    JOIN boards b ON bi.board_id = b.id
    JOIN users u ON bi.invitado_por = u.id
    WHERE bi.id = ?
  `, [result.insertId]);

  return { invitation: inv[0] };
};

// ── Obtener invitaciones pendientes del usuario autenticado ──
export const getMyPendingInvitations = async (userId) => {
  const [rows] = await pool.execute(`
    SELECT 
      bi.id, bi.board_id, bi.invitado_email, bi.rol, bi.estado, bi.fecha_creacion,
      b.nombre AS board_nombre,
      b.portada AS board_portada,
      u.nombre AS invitador_nombre,
      u.email  AS invitador_email
    FROM board_invitations bi
    JOIN boards b ON bi.board_id = b.id
    JOIN users u  ON bi.invitado_por = u.id
    WHERE bi.invitado_id = ? AND bi.estado = 'pendiente'
    ORDER BY bi.fecha_creacion DESC
  `, [userId]);
  return rows;
};

// ── Aceptar invitación ─────────────────────────────────
export const acceptInvitation = async (invitationId, userId) => {
  // Verificar que la invitación pertenece al usuario
  const [invs] = await pool.execute(
    `SELECT id, board_id, rol FROM board_invitations 
     WHERE id = ? AND invitado_id = ? AND estado = 'pendiente'`,
    [invitationId, userId]
  );
  if (!invs[0]) return { error: 'Invitación no encontrada o ya respondida' };

  const inv = invs[0];

  // Obtener el rol_id
  const [roles] = await pool.execute(
    'SELECT id FROM roles WHERE nombre = ?', [inv.rol]
  );
  const rolId = roles[0]?.id ?? 2; // por defecto editor

  // Agregar como miembro del tablero
  await pool.execute(`
    INSERT INTO board_members (board_id, user_id, rol_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id)
  `, [inv.board_id, userId, rolId]);

  // Actualizar estado de la invitación
  await pool.execute(`
    UPDATE board_invitations 
    SET estado = 'aceptada', fecha_respuesta = NOW() 
    WHERE id = ?
  `, [invitationId]);

  return { success: true, boardId: inv.board_id };
};

// ── Rechazar invitación ────────────────────────────────
export const rejectInvitation = async (invitationId, userId) => {
  const [invs] = await pool.execute(
    `SELECT id FROM board_invitations 
     WHERE id = ? AND invitado_id = ? AND estado = 'pendiente'`,
    [invitationId, userId]
  );
  if (!invs[0]) return { error: 'Invitación no encontrada o ya respondida' };

  await pool.execute(`
    UPDATE board_invitations 
    SET estado = 'rechazada', fecha_respuesta = NOW() 
    WHERE id = ?
  `, [invitationId]);

  return { success: true };
};

// ── Obtener invitaciones enviadas de un tablero ────────
export const getBoardInvitations = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT 
      bi.id, bi.invitado_email, bi.rol, bi.estado, bi.fecha_creacion, bi.fecha_respuesta,
      u.nombre AS invitado_nombre
    FROM board_invitations bi
    LEFT JOIN users u ON bi.invitado_id = u.id
    WHERE bi.board_id = ?
    ORDER BY bi.fecha_creacion DESC
  `, [boardId]);
  return rows;
};
