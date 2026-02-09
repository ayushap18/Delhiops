const sendSuccess = (res, data, statusCode = 200, meta = {}) => {
    return res.status(statusCode).json({ success: true, data, ...meta });
};

const sendPaginated = (res, data, pagination, meta = {}) => {
    return res.status(200).json({ success: true, data, pagination, ...meta });
};

const sendCreated = (res, data, meta = {}) => {
    return res.status(201).json({ success: true, data, ...meta });
};

module.exports = {
    sendSuccess,
    sendPaginated,
    sendCreated,
};
