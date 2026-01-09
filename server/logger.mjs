import winston from "winston";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
    'level': 'info',
    'format': winston.format.combine(
        winston.format.timestamp(),
        winston.format.cli(),
        myFormat,
    ),
    'transports': [
        new winston.transports.Console({})
    ]
});

export default logger;