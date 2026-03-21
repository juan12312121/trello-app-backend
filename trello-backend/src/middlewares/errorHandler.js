export const errorHandler = (err, req, res, next) => {
    console.error('[ErrorHandler]', err.stack);
    
    if(err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ok: false, message: 'El recurso ya existe'});
    }

    const statusCode = err.statusCode ?? 500;
    const message = err.message ?? 'Error interno del servidor';

    return res.status(statusCode).json({ok: false, message});
};
