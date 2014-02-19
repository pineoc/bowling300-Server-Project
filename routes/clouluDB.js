/**
 * Created by Administrator on 14. 2. 6.
 */

var mysql = require('mysql');
var pool = mysql.createPool({
    host : '192.168.5.242',
    user : 'uNngoRQm5bioG',
    password : 'pycCkQFZLBDhE',
    database : 'd819024cbca75407a8032591c17b2c10e',
    waitForConnections: false,
    connectionLimit : 100,
    queueLimit : 100
});

module.exports.pool = pool;