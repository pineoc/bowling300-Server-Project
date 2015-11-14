/**
 * Created by pineoc on 14. 2. 6.
 */
var mysql = require('mysql');

var pool = mysql.createPool({
    host : '127.0.0.1',
    user : 'root',
    password : 'qwert123',
    database : 'mydb'
});

module.exports.pool = pool;