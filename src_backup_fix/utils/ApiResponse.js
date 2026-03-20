export class ApiResponse{
    static success(res, data, message= 'OK', statusCode = 200){
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }


  static error(res, message = 'Error interno', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      ok: false,
      message,
      ...(errors && { errors }),
    });
  }

  static created(res, data, message = 'Recurso creado exitosamente') {
    return this.success(res, data, message, 201);
  }

static notFound(res, message = 'Recurso no encontrado') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'No autorizado') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'sin permisos') {
    return this.error(res, message, 403);
    }
}