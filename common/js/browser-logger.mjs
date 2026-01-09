function _log(level, message) {
    let timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level}]\t${message}`);
}

export default {
    info(msg) {
        _log('info', msg);
    },

    warn(msg) {
        _log('warn', msg);
    },

    error(msg) {
        _log('error', msg);
    }
}