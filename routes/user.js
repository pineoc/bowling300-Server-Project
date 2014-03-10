/*
 by pineoc
 pineoc@naver.com
 content : user
 2014.02.03 - start
 * */


//var db = require('./localDB.js');
var db = require('./clouluDB.js');
var cry = require('./crypto_pineoc.js');
var filemgr = require('./filemgr');

var async = require('async');
var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var util = require('util');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

if(process.env.UPLOAD_PATH == undefined)
{
    process.env.UPLOAD_PATH = 'public';
}//if =local


/*
 * cron function
 * 최초 생성 날짜 : 2014.02.11
 * 최종 수정 날짜 : 2014.03.03
 *
 * 기준날짜를 설정하여 exports.rankpoint에서 사용한다.
 * editor : pineoc
 * */
var cronJob = require('cron').CronJob;
var rankPointDateStart = new Date();
var rankPointDateEnd = new Date();
var grplink = "http://bowling.pineoc.cloulu.com/uploads/group/";
var prolink = "http://bowling.pineoc.cloulu.com/uploads/user/";
var countrylink = "http://bowling.pineoc.cloulu.com/uploads/country/";
var nonelink = "http://bowling.pineoc.cloulu.com/uploads/country/none.png";

var job = new cronJob({
    cronTime: '00 00 00 * * 1',
    onTick: function() {
        // Runs every weekday (Monday)
        // at 00:00:00 AM.
        rankPointDateStart.setDate(rankPointDateStart.getDate());//start point
        console.log(rankPointDateStart);

        //reset data on Monday
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on reset data conn pool',err);
            }
            else{
                connection.query('UPDATE account SET allscore=?, allgame=?, avg=?',[0,0,0],function(err2,result){
                    if(err2){
                        console.log('error on reset data query',err2);
                    }
                    else if(result.affectedRows>1){
                        console.log('affected account data.');
                    }
                    else{
                        console.log('none reset data');
                    }
                    connection.release();
                });//query
                connection.query('UPDATE account_has_group SET g_score=?, g_game=?, g_avg=?',[0,0,0],function(err2,result){
                    if(err2){
                        console.log('error on reset data query',err2);
                    }
                    else if(result.affectedRows>1){
                        console.log('affected group data.');
                    }
                    else{
                        console.log('none reset data');
                    }
                    connection.release();
                });//query
            }
        });//conn pool
    },
    start: false,
    timeZone: "Asia/Seoul"
});
job.start();
if(rankPointDateStart.getDay()!=1){
    rankPointDateStart.setDate(rankPointDateStart.getDate()-(rankPointDateStart.getDay()-1));
}
rankPointDateEnd.setDate(rankPointDateStart.getDate()+7);

/*
 * 날짜 스트링 연산
 * 최초 생성 날짜 : 2014.02.11
 * 최종 수정 날짜 : 2014.02.11
 *
 * 받는 데이터 date
 * editor : pineoc
 * */
function formatDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    console.log((year.toString() +'-'+ month.toString() +'-'+ day.toString()));
    return (year.toString() +'-'+ month.toString() +'-'+ day.toString());
}
/*
 * ranking 기준점 전송
 * 최초 생성 날짜 : 2014.02.10
 * 최종 수정 날짜 : 2014.02.11
 *
 * 받는 데이터
 * editor : pineoc
 * */
exports.rankpoint = function(req,res){
    //res.send("respond with a resource");
    var point = {
        startPoint:formatDate(rankPointDateStart),
        endPoint:formatDate(rankPointDateEnd)
    };
    console.log('point start : ',point.startPoint,' end : ',point.endPoint);
    res.json(point);
};

/*
 * 기능 : 회원가입 ( 기본정보 )
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.03.03
 *
 * 밭는 데이터 : email, name, pwd, sex, hand, proPhoto
 * editor : pineoc
 * */

exports.sign = function(req,res){
    var signData = req.body; // 입력할 json 데이터 받을 변수
    console.log('recv data sign : ',signData);
    //사진 파일 업로드 부분 현재
    var proPhoto_file;
    var photo_name;
    if(req.files && !(typeof req.files.proPhoto===undefined)){
        proPhoto_file = req.files.proPhoto;
        photo_name = proPhoto_file.name;
    }

    //check null data
    if(signData.email==null || signData.pwd==null || signData.name==null || signData.country==null ||signData.sex==null || signData.hand==null || !(req.files && !(typeof req.files.proPhoto===undefined))){
        console.log('error on invalid data');
        res.json({result:"FAIL",resultmsg:"INVALID DATA NULL"});
    }
    else{
        var chkDup;
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on connection pool sign check dup',err);
                res.json({result:"FAIL",result_msg:"NETWORK ERR"});
                return;
            }//error on connection pool
            else{
                connection.query('SELECT count(*) cnt FROM account WHERE email=?',[signData.email],
                    function(err2,result){
                        if(err2){
                            console.log('error on query sign check dup',err2);
                            res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                            connection.release();
                            return;
                        }
                        else{
                            console.log('check dup result : ',result[0].cnt);
                            chkDup = result[0].cnt;
                            if(chkDup!=0){
                                console.log('duplication email', chkDup);
                                res.json({result: "FAIL", resultmsg: "DUP EMAIL"});
                                connection.release();
                                return;
                            } else {
                                connection.query('INSERT INTO account(email,name,pwd,sex,country,hand,prophoto,allscore,allgame,avg) VALUES(?,?,?,?,?,?,?,?,?,?)',
                                    [signData.email, signData.name, signData.pwd,signData.sex,signData.country,signData.hand,photo_name,0,0,0], function (err2, result) {
                                        if (err2) {
                                            console.log('error on query sign', err2);
                                            res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                            connection.release();
                                            return;
                                        }
                                        else if (result.affectedRows == 1) {
                                            console.log('sign result : ', result);
                                            returnData = {result: "SUCCESS", aidx: cry.encB(result.insertId)};
                                            var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',(result.insertId).toString());//aidx를 이용
                                            console.log('userfolder : ',userfolder);
                                            if(!fs.existsSync(userfolder)){
                                                mkdirp(userfolder,function(err){
                                                    if(err){
                                                        console.log('error on mkdirp make userdir',err);
                                                        res.json({result:"FAIL",resultmsg:"FILE UPLOAD FAIL"});
                                                        return;
                                                    }else{
                                                        console.log('success path load pro');
                                                    }
                                                });//mkdirp
                                            }
                                            var result_upload = filemgr.uploadfunction(result.insertId,"profile",proPhoto_file);
                                            if(result_upload.result=="SUCCESS"){
                                                console.log(result_upload);
                                                res.json(returnData);
                                            }
                                            else{
                                                console.log(result_upload);
                                                res.json({result:"FAIL",resultmsg:"FILE UPLOAD FAIL"});
                                            }
                                        }
                                        connection.release();
                                    });//query
                            }
                        }
                    });//query
            }
        });//connection pool
    }
};

/*
 * 기능 : 회원 정보 추가 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.03.10
 *
 * 받는 데이터 : year, ballweight, style, step, series800, series300, ballphoto
 *
 * editor : pineoc
 * */
exports.addsign = function(req,res){
    var addSignData = req.body; // json data
    var aidx = addSignData.aidx;
    console.log('recv data addsign, data : ',addSignData);
    if (addSignData.aidx == 0 || addSignData==null ) {
        console.log('aidx 0 error on addsign');
        res.json({result: "FAIL", resultmsg: "INVALID DATA NULL"});
        return;
    } else {
        aidx = cry.decB(addSignData.aidx);
        var photo_file;
        var photo_name;
        if (req.files && !(typeof req.files.photo === undefined)) {
            photo_file = req.files.proPhoto;
            photo_name = photo_file.name;

            async.waterfall([
                function(callback){
                    filemgr.deletefunction(aidx,"pro");
                    console.log('delete pro photo addsign');
                    callback(null,1);
                },
                function(arg,callback){
                    var result_upload = filemgr.uploadfunction(aidx,"profile",photo_file);
                    if(result_upload.result=="SUCCESS"){
                        console.log('success on file upload addsign');
                        callback(null,1);
                    }
                    else{
                        console.log('fail on file upload addsign');
                        res.json({result:"FAIL",resultmsg:"FILE UPLOAD FAIL"});
                        return;
                    }
                },
                function(arg1,callback){
                    db.pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log('error on connection pool addsign', err);
                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                            return;
                        }//error on connection pool
                        else {
                            if(addSignData.pwd==null){
                                connection.query('UPDATE account SET name=?,sex=?,hand=?,year=?,country=?,prophoto=?, ballweight=?, style=?,step=?,series800=?,series300=? where a_idx=?',
                                    [addSignData.name, addSignData.sex, addSignData.hand, addSignData.year, addSignData.country,photo_name,
                                        addSignData.ballweight, addSignData.style, addSignData.step, addSignData.series800, addSignData.series300, aidx], function (err2, result) {
                                        if (err2) {
                                            console.log('error on query addsign', err2);
                                            res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                            connection.release();
                                            return;
                                        }//error on query
                                        else if (result.affectedRows == 1) {
                                            console.log('success, result : ', result);
                                            callback(null,1);
                                        }//insert success
                                        connection.release();
                                    });//query

                            }else{
                                connection.query('UPDATE account SET name=?,pwd=?,sex=?,hand=?,year=?,country=?,prophoto=?, ballweight=?, style=?,step=?,series800=?,series300=? where a_idx=?',
                                    [addSignData.name, addSignData.pwd, addSignData.sex, addSignData.hand, addSignData.year, addSignData.country,photo_name,
                                        addSignData.ballweight, addSignData.style, addSignData.step, addSignData.series800, addSignData.series300, aidx], function (err2, result) {
                                        if (err2) {
                                            console.log('error on query addsign', err2);
                                            res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                            connection.release();
                                            return;
                                        }//error on query
                                        else if (result.affectedRows == 1) {
                                            console.log('success, result : ', result);
                                            callback(null,1);
                                        }//insert success
                                        connection.release();
                                    });//query
                            }
                        }//no error on connection pool
                    });//connection pool
                }
            ],function(err,result){
                if(err){
                    console.log('addsign fail waterfall, err : ',err);
                    res.json({result: "FAIL", resultmsg: "NETWORK ERR W"});
                    return;
                }else{
                    console.log('addsign success waterfall');
                    res.json({result: "SUCCESS", resultmsg: "ADDSIGN SUCCESS"});
                }
            });//waterfall end
        }
        else{//no file
            if(addSignData.pwd==null){
                db.pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log('error on connection pool addsign', err);
                        res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else {
                        connection.query('UPDATE account SET name=?,sex=?,hand=?,year=?,country=?, ballweight=?, style=?,step=?,series800=?,series300=? where a_idx=?',
                            [addSignData.name, addSignData.sex, addSignData.hand, addSignData.year, addSignData.country,
                                addSignData.ballweight, addSignData.style, addSignData.step, addSignData.series800, addSignData.series300, aidx], function (err2, result) {
                                if (err2) {
                                    console.log('error on query addsign', err2);
                                    res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                    connection.release();
                                    return;
                                }//error on query
                                else if (result.affectedRows == 1) {
                                    console.log('success, result : ', result);
                                    res.json({result: "SUCCESS", resultmsg: "ADDSIGN SUCCESS"});
                                }//insert success
                                connection.release();
                            });//query
                    }//no error on connection pool
                });//connection pool

            }else{
                db.pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log('error on connection pool addsign', err);
                        res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else {
                        connection.query('UPDATE account SET name=?,pwd=?,sex=?,hand=?,year=?,country=?, ballweight=?, style=?,step=?,series800=?,series300=? where a_idx=?',
                            [addSignData.name, addSignData.pwd, addSignData.sex, addSignData.hand, addSignData.year, addSignData.country,
                                addSignData.ballweight, addSignData.style, addSignData.step, addSignData.series800, addSignData.series300, aidx], function (err2, result) {
                                if (err2) {
                                    console.log('error on query addsign', err2);
                                    res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                    connection.release();
                                    return;
                                }//error on query
                                else if (result.affectedRows == 1) {
                                    console.log('success, result : ', result);
                                    res.json({result: "SUCCESS", resultmsg: "ADDSIGN SUCCESS"});
                                }//insert success
                                connection.release();
                            });//query
                    }//no error on connection pool
                });//connection pool
            }
        }
    }
};

/*
 * 유저정보
 * 최초 생성 날짜 : 2014.02.19
 * 최종 수정 날짜 : 2014.02.19
 *
 * 받는 데이터 aidx
 * editor : pineoc
 * 미구현 부분 : 사진 파일 업로드 부분
 * */

exports.userinfo = function(req,res){
    var infoData = req.body;
    console.log('recv data userinfo : ',infoData);
    var aidx;
    if(infoData.aidx!=0){
        aidx = cry.decB(infoData.aidx);
    }
    else{
        aidx=0;
    }
    var resultData;
    if(aidx==0){
        console.log('No data, because no id');
        res.json({result:"FAIL",resultmsg:"NO ACCOUNT"});
        return;
    }
    else{
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on conn pool userinfo',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                return;
            }else{
                connection.query('SELECT * FROM account where a_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on Query userinfo',err);
                        res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                        connection.release();
                        return;
                    }else if(result){
                        console.log('Success on query : ',result);
                        resultData = {
                            email : result[0].email,
                            name : result[0].name,
                            proPhoto : result[0].prophoto==null ? nonelink : prolink+aidx+"/"+result[0].prophoto,
                            ballPhoto : result[0].ballphoto,
                            sex : result[0].sex,
                            hand : result[0].hand,
                            locale : result[0].locale,
                            allhighScore : result[0].all_highscore,
                            country : result[0].country,
                            style : result[0].style,
                            step : result[0].step,
                            series300 : result[0].series300,
                            series800 : result[0].series800
                        };
                        res.json(resultData);
                    }
                    else{
                        console.log('no data on query userinfo',result);
                        res.json({result:"FAIL",resultmsg:"NO DATA"});
                    }
                    connection.release();
                });//query
            }
        });//conn pool
    }

};

/*
 * 점수 데이터 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.24
 *
 * 받는 데이터 aidx , data(점수)
 * editor : pineoc
 * 미구현 부분 : 사진 파일 업로드 부분
 * */
exports.insertScore = function(req,res){
    var insData = req.body; // 입력할 데이터를 받음
    console.log('recv data insert Score: ',insData);
    var data = insData.myscoredata;
    var dataLength = insData.myscoredata.length;
    var aidx = cry.decB(insData.aidx);
    var s_allScore = 0;
    var s_allGame = 0;
    var errCount=0;

    console.log('datalength: ',dataLength);
    if (dataLength == 0) {//no data
        console.log('error, no data ');
        res.json({result: "FAIL", resultmsg: "NO DATA"});
    } else {
        data.forEach(function(ind){
            if (ind.type == -1) {//solo data
                s_allScore = ind.allScore;
                s_allGame = ind.allGame;
                console.log('s_data :', s_allGame, s_allScore);
                if (s_allScore / s_allGame > 300) {//check valid
                    console.log('INVALID data over 300 avg solo');
                    res.json({result: "FAIL", resultmsg: "INVALID OVER 300"});
                    return;
                }
                else if (s_allGame == 0) {
                    console.log('INVALID data allgame 0 solo');
                    res.json({result: "FAIL", resultmsg: "INVALID GAME ZERO"});
                    return;
                }
                else {
                    //update to db-------------------------------------------------
                    db.pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log('error on connection pool insert', err);
                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                            return;
                        }//error on connection pool
                        else {
                            connection.query('UPDATE account SET allscore=?, allgame=?, avg=? WHERE a_idx=?',
                                [s_allScore, s_allGame,parseFloat(s_allScore/s_allGame).toFixed(4), aidx], function (err2, result) {
                                    if (err2) {
                                        console.log('error on query insert solo', err2);
                                        res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                        errCount++;
                                        connection.release();
                                        return;
                                    }
                                    else if (result.affectedRows == 1) {
                                        console.log('success solo, result', result);
                                        //res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                    }//insert success
                                    connection.release();
                                });//query
                        }//no error on connection pool
                    });//connection pool
                    //-------------------------------------------------------------
                }
            }
            else if (ind.type > 0 && ind.league == 0) {//group data
                var grpIdx = ind.type;
                var grpScore = ind.allScore;
                var grpGame = ind.allGame;
                if (grpScore / grpGame > 300) {//check valid
                    console.log('INVALID data over 300 avg in grp, gidx : ', grpIdx);
                    res.json({result: "FAIL", resultmsg: "INVALID OVER 300"});
                    return;
                }
                else if (grpGame == 0) {
                    console.log('INVALID data allgame 0 grp, gidx :', grpIdx);
                    res.json({result: "FAIL", resultmsg: "INVALID GAME ZERO"});
                    return;
                }
                else {
                    db.pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log('error on connection pool group', err);
                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                            return;
                        }//error on connection pool
                        else {
                            connection.query('UPDATE account_has_group SET g_score=?,g_game=?,g_avg=? WHERE account_a_idx=? AND group_g_idx=?',
                                [grpScore, grpGame,parseFloat(grpScore/grpGame).toFixed(4), aidx, grpIdx], function (err2, result) {
                                    if (err2) {
                                        console.log('error on query insert grp', err2);
                                        res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                        errCount++;
                                        connection.release();
                                        return;
                                    }//error on query
                                    else if (result.affectedRows == 1) {
                                        console.log('success grp, result : ', result);
                                        console.log('insertScore, grp data  on query : ', grpIdx, grpScore, grpGame);
                                    }//insert success
                                    connection.release();
                                });//query
                        }//no error on connection pool
                    });//connection pool
                }
            }//group data
            else if (ind.type > 0 && ind.league == 1) {//group data
                var grpIdx = ind.type;
                var grpScore = ind.allScore;
                var grpGame = ind.allGame;
                if (grpScore / grpGame > 300) {//check valid
                    console.log('INVALID data over 300 avg in grp, gidx : ', grpIdx);
                    res.json({result: "FAIL", resultmsg: "INVALID OVER 300"});
                    return;
                }
                else if (grpGame == 0) {
                    console.log('INVALID data allgame 0 grp, gidx:', grpIdx);
                    res.json({result: "FAIL", resultmsg: "INVALID GAME ZERO"});
                    return;
                }
                else {
                    db.pool.getConnection(function (err, connection) {
                        if (err) {
                            console.log('error on conn pool league insert');
                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                            return;
                        } else {
                            connection.query('UPDATE account_has_group SET league_avg=?,league_date=now() WHERE account_a_idx=? AND group_g_idx=?',
                                [parseFloat(grpScore / grpGame).toFixed(4), aidx, grpIdx], function (err2, result) {
                                    if (err2) {
                                        console.log('error on query league insert');
                                        res.json({result: "FAIL", resultmsg: "INVALID DATA"});
                                        errCount++;
                                        connection.release();
                                        return;
                                    }
                                    else if (result.affectedRows == 1) {
                                        console.log('success league , result', result);
                                        console.log('insertScore, league data  on query : ', grpIdx, grpScore, grpGame);
                                    }
                                    connection.release();
                                });//query
                        }
                    });//conn pool
                }
            }//group data
            else {
                console.log('type error', insData, data);
            }
        });
        if (errCount == 0) {
            console.log('success normal data all', data);
            res.json({result: "SUCCESS", resultmsg: data}); // result_msg에 대한 부분은 차후 수정
        }
        else {
            console.log('error occur on insert on solo or grp or league');
            res.json({result: "FAIL", resultmsg: "ERROR ON INSERT", data: data});
        }
    }
};//insertScore
