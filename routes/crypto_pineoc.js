/**
 * Created by skplanet on 14. 2. 19.
 */
var crypto = require('crypto');
var hash_int = require('hash-int');

/*
 * aidx, gidx 암호화(hashing)
 * 최초 생성 날짜 : 2014.02.19
 * 최종 수정 날짜 : 2014.02.19
 *
 * 받는 데이터
 * editor : pineoc
 * */

var encryption;
var decryption;
var hash_int_function;
var encB;
var decB;
encryption = function (idx) {
    var key = 'jung_jung_park_han_lee';
    var plaintext = idx;
    var cipher = crypto.createCipher('aes-256-cbc', key);
    var decipher = crypto.createDecipher('aes-256-cbc', key);
    cipher.update(plaintext, 'utf8', 'binary');
    var encryptedPassword = cipher.final('binary');
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

decryption = function (hash) {
    var key = 'jung_jung_park_han_lee';
    var decipher = crypto.createDecipher('aes-256-cbc', key);
    decipher.update(hash, 'binary', 'utf8');
    var decryptedPassword = decipher.final('utf8');
    return decryptedPassword;
};

hash_int_function = function(target){
    return hash_int(target);
};

encB = function(data){
    var cryptbase1= -123456789098762;
    var encrypted= (data^cryptbase1);
    return encrypted;
};
decB = function(encData){
    var cryptbase1= -123456789098762;
    var decrypted= (encData^cryptbase1);
    return decrypted;
};

module.exports.encryption = encryption;
module.exports.decryption = decryption;
module.exports.hash_int_function = hash_int_function;
module.exports.encB = encB;
module.exports.decB = decB;