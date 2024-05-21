const request = require('request');

function apiCall(url, options, method, callback) {
    request[method](url, options, (error, response, body) => {
        if (error) {
            return callback(error, null);
        }
        try {
            const result = JSON.parse(body);
            callback(null, result);
        } catch (e) {
            callback(e, null);
        }
    });
}

module.exports = { apiCall };
