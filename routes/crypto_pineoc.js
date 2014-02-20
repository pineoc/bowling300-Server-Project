/**
 * Created by skplanet on 14. 2. 19.
 */
var crypto = require('crypto');

/*
 * aidx, gidx 암호화(hashing)
 * 최초 생성 날짜 : 2014.02.19
 * 최종 수정 날짜 : 2014.02.19
 *
 * 받는 데이터
 * editor : pineoc
 * */

var encryption;
encryption = function (idx) {
    var key = 'jung_jung_park_han_lee';
    var plaintext = idx;
    var cipher = crypto.createCipher('aes-256-cbc', key);
    var decipher = crypto.createDecipher('aes-256-cbc', key);
    cipher.update(plaintext, 'utf8', 'base64');
    var encryptedPassword = cipher.final('base64');
    return encryptedPassword;
};

/*
 * aidx, gidx 복호화(hashing)
 * 최초 생성 날짜 : 2014.02.19
 * 최종 수정 날짜 : 2014.02.19
 *
 * 받는 데이터
 * editor : pineoc
 * */
var decryption;
decryption = function (hash) {
    var key = 'jung_jung_park_han_lee';
    var decipher = crypto.createDecipher('aes-256-cbc', key);
    decipher.update(hash, 'base64', 'utf8');
    var decryptedPassword = decipher.final('utf8');
    return decryptedPassword;
};

module.exports.encryption = encryption;
module.exports.decryption = decryption;