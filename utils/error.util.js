class AppError extends Error {
    constructor(statusCode,message){
        super(message);

        this.statusCode = statusCode;

        Error.captureStackTrace(this,this.contructor)
    }
}

export default AppError;