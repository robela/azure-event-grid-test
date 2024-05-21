const crypto = require('crypto');

class Cryptography {
    constructor(algorithm, password) {
        this.algorithm = algorithm;
        this.password = password;
    }

    decryptText(encryptedText, decryptionEncoding, encryptionEncoding) {
        const decipher = crypto.createDecipher(this.algorithm, this.password);
        let decrypted = decipher.update(encryptedText, encryptionEncoding, decryptionEncoding);
        decrypted += decipher.final(decryptionEncoding);
        return decrypted;
    }
}

module.exports = Cryptography;
