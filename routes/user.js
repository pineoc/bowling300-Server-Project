/*
by pineoc
pineoc@naver.com
content : user
2014.02.03 - start
* */
var async = require('async');

//var db = require('./localDB.js');
var db = require('./clouluDB.js');
var cry = require('./crypto_pineoc.js');

var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var util = require('util');
var mkdirp = require('mkdirp');
var crypto = require('crypto');


/*
 * cron function
 * 최초 생성 날짜 : 2014.02.11
 * 최종 수정 날짜 : 2014.02.11
 *
 * 기준날짜를 설정하여 exports.rankpoint에서 사용한다.
 * editor : pineoc
 * */
var cronJob = require('cron').CronJob;
var rankPointDateStart = new Date();
var rankPointDateEnd = new Date();
var job = new cronJob({
    cronTime: '00 00 00 * * 1',
    onTick: function() {

        // Runs every weekday (Monday)
        // at 00:00:00 AM.
        rankPointDateStart.setDate(rankPointDateStart.getDate());//start point
        console.log(rankPointDateStart);
    },
    start: false,
    timeZone: "Asia/Seoul"
});
job.start();


if(process.env.UPLOAD_PATH == undefined)
{
    process.env.UPLOAD_PATH = 'public';
}//if =local

/*
 * upload function
 * 최초 생성 날짜 : 2014.02.09
 * 최종 수정 날짜 : 2014.02.11
 *
 * 받는 데이터 aidx, upfile, type
 * editor : pineoc
 * */
var uploadfunction = function(userid,type,upfile){
    //var type = req.body.type;
    //var upfile = req.files.upfile;
    //var userid = req.body.aidx;
    var name=upfile.name;//upload file name ex>file.jpg
    var srcpath = upfile.path;//현재 폴더 위치 -> 업로드 하는 기기
    var destpath;

    if(upfile.originalFilename!=''){
        if(type=="profile"){
            var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',userid.toString());//aidx를 이용
            console.log('userfolder : ',userfolder);
            if(!fs.existsSync(userfolder)){
                //fs.mkdirSync(userfolder);
                mkdirp(userfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make userdir',err);
                        res.json({result:"FAIL",resultmsg:"FAIL MKDIR"});
                    }else{
                        console.log('success');
                    }
                });//mkdirp
            }
            var destpath = path.resolve(__dirname,'..',userfolder,name);
        }
        else if(type=="group"){
            var groupfolder = path.resolve(process.env.UPLOAD_PATH,'group',userid.toString());//gidx를 이용
            console.log('groupfolder : ',groupfolder);
            if(!fs.existsSync(groupfolder)){
                //fs.mkdirSync(userfolder);
                mkdirp(groupfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make groupdir',err);
                        res.json({result:"FAIL",resultmsg:"FAIL MKDIR"});
                    }else{
                        console.log('success');
                    }
                });//mkdirp
            }
            var destpath = path.resolve(__dirname,'..',groupfolder,name);
        }
//        else if(type=="board"){
//
//        }
//        else if(type=="ball"){
//
//        }
//        var name=upfile.name;//upload file name ex>file.jpg
//        var srcpath = upfile.path;//현재 폴더 위치 -> 업로드 하는 기기
//        var destpath = path.resolve(__dirname,'..',userfolder,name);
//        //public/1/이미지.jpg
        var checkext = path.extname(name);
        checkext=checkext.toLowerCase();
        //check image ext
        if(checkext=='.jpg' || checkext=='.jpeg' || checkext=='.png'){
            var is = fs.createReadStream(srcpath); //소스로부터 스트림을 입력받음
            var os = fs.createWriteStream(destpath);//읽어온 스트림을 통해서 사진파일 생성
            is.pipe(os);
            is.on('end',function(){
                fs.unlinkSync(srcpath);
                var srcimg = destpath;
                var idx = destpath.lastIndexOf('.');
                var ext = destpath.substring(idx); // .jpg
                var filename = destpath.substring(0,idx);
            });//is.on callback function
            console.log('success');
            //res.json({result:"SUCCESS",resultmsg:"FILE UPLOAD SUCCESS"});
            return {result:"SUCCESS",resultmsg:"UPLOAD SUCCESS"};
        }
        else{//invalid data type
                console.log('invalid file image');
                //res.json({result:"FAIL",resultmsg:"INVALID"});
            return {result:"FAIL",resultmsg:"INVALID"};
        }
    }
    else{//no file
        console.log('no file');
        return {result:"FAIL",resultmsg:"NO FILE"};
    }
};//upload function

/*
 * delete function
 * 최초 생성 날짜 : 2014.02.17
 * 최종 수정 날짜 : 2014.02.17
 *
 * 받는 데이터 aidx, type
 * editor : pineoc
 * */

function deletePhoto(aidx,type){
    var retval;
    if(type=="pro"){
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on conn pool del prophoto',err);
                //res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                retval=-1;
                return;
            }else{
                connection.query('SELECT prophoto from account where a_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del prophoto',err2);
                        //res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        retval=-1;
                        return;
                    }
                    else{
                        console.log('success prophoto:',result[0].prophoto);
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',aidx);
                        fs.unlink(userfolder+"/"+result[0].prophoto, function (err) {
                            if (err){
                                console.log('error on delete file',err);
                                retval=-1;
                                return;
                            }else{
                                console.log('successfully deleted',userfolder);
                                retval=1;
                            }
                        });
                        connection.release();
                    }
                });//query
            }
        });//connection pool
        return retval;
    }
    else if(type=="ball"){
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on conn pool del ballphoto',err);
                //res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                retval=-1;
                return;
            }else{
                connection.query('SELECT ballphoto from account where a_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del ballphoto',err);
                        //res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        retval=-1;
                        return;
                    }
                    else{
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',aidx);
                        fs.unlink(userfolder+"/"+result[0].ballphoto, function (err) {
                            if (err){
                                console.log('error on delete file',err);
                                retval=-1;
                                return;
                            }else{
                                console.log('successfully deleted',userfolder);
                                retval=1;
                            }
                        });
                    }
                    connection.release();
                });//query
            }
        });//connection pool
        return retval;
    }
    else if(type=="group"){
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on conn pool del grpphoto',err);
                //res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                retval=-1;
                return;
            }else{
                connection.query('SELECT g_photo from groups where g_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del grpphoto',err);
                        //res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        retval=-1;
                        return;
                    }
                    else{
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'group',aidx);
                        fs.unlink(userfolder+"/"+result[0].g_photo, function (err) {
                            if (err){
                                console.log('error on delete file',err);
                                retval=-1;
                                return;
                            }else{
                                console.log('successfully deleted',userfolder);
                                retval=1;
                            }
                        });
                    }
                    connection.release();
                });//query
            }
        });//connection pool
        return retval;
    }
}


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
    if(rankPointDateStart.getDay()!=1){
        rankPointDateStart.setDate(rankPointDateStart.getDate()-(rankPointDateStart.getDay()-1));
    }
    rankPointDateEnd.setDate(rankPointDateStart.getDate()+7);
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
* 최종 수정 날짜 : 2014.02.12
*
* editor : pineoc
* 미구현 부분 : 사진 파일 업로드 부분
* */

 exports.sign = function(req,res){
    var signData = req.body; // 입력할 json 데이터 받을 변수
    console.log(req.body);
    //사진 파일 업로드 부분 현재
    var proPhoto_file = req.files.proPhoto;
     var photo_name;
    if(proPhoto_file!=null){
        photo_name = proPhoto_file.name;
    }
    else{
        photo_name = null;
    }
    if(signData.email==null || signData.pwd==null || signData.name==null || signData.sex==null || signData.hand==null){
        console.log('error on invalid data');
        res.json({result:"FAIL",resultmsg:"INVALID DATA(NULL)"});
    }
     else{
        var chkDup;
        console.log('recv data sign : ',signData);
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on connection pool sign check dup',err);
                res.json({result:"FAIL",result_msg:"NETWORK ERR"});
                return;
            }//error on connection pool
            else{
                //console.log('data : ',signData,signData.email,signData.name,signData.pwd);
                connection.query('SELECT count(*) cnt FROM account WHERE email=?',[signData.email],
                    function(err2,result){
                    if(err2){
                        console.log('error on query sign check dup',err2);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        return;
                    }
                    else{
                        console.log('check dup result : ',result[0].cnt);
                        chkDup = result[0].cnt;
                        if(chkDup!=0){
                            console.log('duplication email', chkDup);
                            res.json({result: "FAIL", resultmsg: "DUP EMAIL"});
                        } else {
                            db.pool.getConnection(function (err, connection) {
                                if (err) {
                                    console.log('error on connection pool sign', err);
                                    res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                    return;
                                }//error on connection pool
                                else {
                                    connection.query('INSERT INTO account(email,name,pwd,sex,country,hand,prophoto,allscore,allgame) VALUES(?,?,?,?,?,?,?,?,?)',
                                        [signData.email, signData.name, signData.pwd,signData.sex,signData.country,signData.hand,photo_name,0,0], function (err2, result) {
                                            if (err2) {
                                                console.log('error on query sign', err2);
                                                res.json({result: "FAIL", resultmsg: "NETWORK ERR Q"});
                                                return;
                                            }
                                            else if (result.affectedRows == 1) {
                                                console.log('sign result : ', result);
                                                returnData = {result: "SUCCESS", aidx: cry.encB(result.insertId)};
                                                var result_upload = uploadfunction(result.insertId,"profile",proPhoto_file);
                                                if(result_upload.result=="SUCCESS"){
                                                    console.log(result_upload);
                                                    res.json(returnData);
                                                }
                                                else{
                                                    console.log(result_upload);
                                                    res.json({result:"FAIL",resultmsg:"BUT UPLOAD FAIL"});
                                                }
                                            }
                                            connection.release();
                                        });//query
                                }
                            });//connection pool
                        }
                    }
                    connection.release();
                });//query
            }
        });//connection pool
    }
};

/*
 * 기능 : 회원 정보 추가 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.19
 *
 * 받는 데이터 : year, ballweight, style, step, series800, series300, ballphoto
 *
 * editor : pineoc
 * */
exports.addsign = function(req,res){
    var addSignData = req.body; // json data
    var aidx = cry.decB(req.body.aidx);
    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on connection pool addsign',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
            return;
        }//error on connection pool
        else{
            connection.query('UPDATE account SET name=?,pwd=?,sex=?,hand=?,year=?, ballweight=?, style=?,step=?,series800=?,series300=? where a_idx=?',
                [addSignData.name,addSignData.pwd,addSignData.sex,addSignData.hand,addSignData.year,
                    addSignData.ballweight,addSignData.style,addSignData.step,addSignData.series800,addSignData.series300,aidx],function(err2,result){
                    if(err2){
                        console.log('error on query addsign',err2);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        return;
                    }//error on query
                    else if(result.affectedRows==1){
                        console.log('success, result : ',result);
                        res.json({result:"SUCCESS",resultmsg:result}); // result_msg에 대한 부분은 차후 수정
                    }//insert success
                    connection.release();
                });//query
        }//no error on connection pool
    });//connection pool
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
        res.json({result:"FAIL",resultmsg:"NO DATA"});
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
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        return;
                    }else{
                        console.log('Success on query : ',result);
                        resultData = {
                            email : result[0].email,
                            name : result[0].name,
                            proPhoto : result[0].prophoto==null ? "http://bowling.pineoc.cloulu.com/uploads/country/KakaoTalk_b6634420cfc0d1b1.png" : "http://bowling.pineoc.cloulu.com/uploads/user/"+infoData.aidx+"/"+result[0].prophoto,
                            ballPhoto : result[0].ballphoto,
                            sex : result[0].sex,
                            hand : result[0].hand,
                            locale : result[0].locale,
                            allhighscore : result[0].all_highscore,
                            country : result[0].country,
                            style : result[0].style,
                            step : result[0].step,
                            series300 : result[0].series300,
                            series800 : result[0].series800
                        };
                        res.json(resultData);
                    }
                });//query
            }
        });//conn pool
    }

};

/*
 * 점수 데이터 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.11
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

    console.log('datalength: ',dataLength);
    console.log('data : ',data);
    if(dataLength!=0){
        for(var i=0;i<dataLength;i++){
            if(data[i].type==-1){//solo data
                s_allScore = data[i].allScore;
                s_allGame = data[i].allGame;
                console.log('s_data :',s_allGame,s_allScore );
                if(s_allScore/s_allGame>300){//check valid
                    console.log('INVALID data over 300 avg solo');
                    res.json({result:"FAIL",resultmsg:"INVALID OVER 300"});
                    return;
                }
                else if(s_allGame==0){
                    console.log('INVALID data allgame 0 solo');
                    res.json({result:"FAIL",resultmsg:"INVALID GAME ZERO"});
                    return;
                }
                else{
                    //update to db-------------------------------------------------
                    db.pool.getConnection(function(err,connection){
                        if(err){
                            console.log('error on connection pool insert',err);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            return;
                        }//error on connection pool
                        else{
                            connection.query('UPDATE account SET allscore=?, allgame=? WHERE a_idx=?',
                                [s_allScore,s_allGame,aidx],function(err2,result){
                                    if(err2){
                                        console.log('error on query insert solo',err2);
                                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                        return;
                                    }
                                    else if(result.affectedRows==1){
                                        console.log('success solo, result',result);
                                        //res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                    }//insert success
                                    connection.release();
                            });//query
                        }//no error on connection pool
                    });//connection pool
                    //-------------------------------------------------------------
                }
            }
            else if(data[i].type>0){//group data
                var grpIdx = data[i].type;
                var grpScore = data[i].allScore;
                var grpGame = data[i].allGame;
                console.log('insertScore, grp data : ',grpIdx,grpScore,grpGame);
                if(grpScore/grpGame>300){//check valid
                    console.log('INVALID data over 300 avg in grp, gidx : ',grpIdx);
                    res.json({result:"FAIL",resultmsg:"INVALID OVER 300"});
                    return;
                }
                else if(grpGame==0){
                    console.log('INVALID data allgame 0 grp, gidx:',grpIdx);
                    res.json({result:"FAIL",resultmsg:"INVALID GAME ZERO"});
                    return;
                }
                else{
                    if(data[i].league==0){ // no league
                        db.pool.getConnection(function(err,connection){
                            if(err){
                                console.log('error on connection pool group',err);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                                return;
                            }//error on connection pool
                            else{
                                connection.query('UPDATE account_has_group SET g_score=?,g_game=? WHERE account_a_idx=? AND group_g_idx=?',
                                    [grpScore,grpGame,aidx,grpIdx],function(err2,result){
                                        if(err2){
                                            console.log('error on query insert grp',err2);
                                            res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                            return;
                                        }//error on query
                                        else if(result.affectedRows==1){
                                            console.log('success grp, result : ',result);
                                            //res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                        }//insert success
                                        connection.release();
                                    });//query
                            }//no error on connection pool
                        });//connection pool
                    }
                    else{ //league data
                            db.pool.getConnection(function(err,connection){
                            if(err){
                                console.log('error on conn pool league insert');
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                                return;
                            }else{
                                connection.query('UPDATE account_has_group SET league_avg=?,league_date=now() WHERE account_a_idx=? AND group_g_idx=?',
                                    [(grpScore/grpGame).toFixed(4),aidx,grpIdx],function(err2,result){
                                    if(err2){
                                        console.log('error on query league insert');
                                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                        return;
                                    }
                                    else if(result.affectedRows==1){
                                        console.log('success league , result',result);
                                    }
                                    connection.release();
                                });//query
                            }
                        });//conn pool
                    }
                }
            }//group data
            else{
                console.log('type error',insData);
                res.json({result:"FAIL",resultmsg:"TYPE ERR"});
                return;
            }
        }//for
        console.log('success normal data all', data);
        res.json({result:"SUCCESS",resultmsg:data}); // result_msg에 대한 부분은 차후 수정
    }//if end
    else if(data.length==0){
        console.log('error, no data ');
        res.json({result:"FAIL",resultmsg:"NO DATA"});
    }//no data
};//insertScore

exports.deletePhoto = function(req,res){

};//사진 삭제