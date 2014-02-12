/**
 * Created by Administrator on 14. 2. 6.
 */

var mysql = require('mysql');
var pool = mysql.createPool({
    host : '192.168.4.242',
    user : 'u7HerppIsbEMD',
    password : 'pvsDE4dgiQfwH',
    database : 'dfbf766f5ed554b15b75fc4859bee4cc2',
    waitForConnections: false,
    connectionLimit : 100,
    queueLimit : 100
});

module.exports.pool = pool;