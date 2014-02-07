/**
 * Created by Administrator on 14. 2. 6.
 */

var mysql = require('mysql');
var pool = mysql.createPool({
    host : '127.0.0.1',
    user : 'root',
    password : '1234',
    database : 'mydb'
});
module.exports.pool = pool;