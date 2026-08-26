// Custom error class to handle API errors with custom status codes
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  let errorsArray = [];

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
    errorsArray.push({ field: 'id', message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
    const key = Object.keys(err.keyValue)[0];
    errorsArray.push({ field: key, message: `${key} is already registered` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
    Object.keys(err.errors).forEach(key => {
      errorsArray.push({ field: key, message: err.errors[key].message });
    });
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token invalid';
    error = new ErrorResponse(message, 401);
    errorsArray.push({ field: 'token', message });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized, token expired';
    error = new ErrorResponse(message, 401);
    errorsArray.push({ field: 'token', message });
  }

  if (errorsArray.length === 0) {
    errorsArray.push({ field: 'server', message: error.message || 'Server Error' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    data: null,
    errors: errorsArray
  });
};

module.exports = {
  ErrorResponse,
  errorHandler
};

