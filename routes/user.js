/*
by pineoc
pineoc@naver.com
content : user
2014.02.03 - start
* */


var async = require('async');

//var db = require('./localDB.js');
var db = require('./clouluDB.js');

var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var util = require('util');
var mkdirp = require('mkdirp');


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
        cosole.log(rankPointDateStart,rankPointDateEnd);
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
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',aidx);
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
    if(signData.email==null || signData.pwd==null || signData.name==null || signData.sex==null){
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
                                                returnData = {result: "SUCCESS", aidx: result.insertId};
                                                var result_upload = uploadfunction(result.insertId,"profile",proPhoto_file);
                                                if(result_upload.result=="SUCCESS"){
                                                    console.log(result_upload);
                                                    res.json(returnData);
                                                }
                                                else{
                                                    console.log(result_upload);
                                                    res.json({result:"SUCCESS",resultmsg:"BUT UPLOAD FAIL"});
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
 * 최종 수정 날짜 : 2014.02.18
 *
 * 받는 데이터 : year, ballweight, style, step, 800series, 300series, ballphoto
 *
 * editor : pineoc
 * */
exports.addsign = function(req,res){
    var addSignData = req.body; // json data


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
    var data = insData.myscoredata;
    var dataL = insData.leaguedata;
    var dataLength = insData.myscoredata.length;
    var dataLengthL = insData.leaguedata.length;
    var aidx = insData.aidx;
    var s_allScore = 0;
    var s_allGame = 0;
    console.log('recv data insert Score: ',insData);
    console.log('datalength: ',dataLength);
    console.log('data : ',data);
    //console.log('data.type : ',data[0].type,data[1].type,data[2].type);
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
                                        console.log('success, result',result);
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
                                        console.log('success, result : ',result);
                                        //res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                    }//insert success
                                    connection.release();
                                });//query
                        }//no error on connection pool
                    });//connection pool
                }
            }//group data
            else{
                console.log('type error',insData);
                res.json({result:"FAIL",resultmsg:"TYPE ERR"});
                return;
            }
        }//for
        console.log('success normal data all');
        res.json({result:"SUCCESS",resultmsg:data}); // result_msg에 대한 부분은 차후 수정
    }//if end
    else if(data.length==0){
        console.log('error, no data ');
        res.json({result:"FAIL",resultmsg:"NO DATA"});
    }//no data
    if(dataLengthL!=0){
        for(var i=0;i<dataLengthL;i++){
            if(dataL[i].type>0){
                console.log('league data : ',dataL[i]);
                if(dataL[i].allScore/dataL[i].allGame>300){
                    console.log('INVALID data over 300 avg league');
                    res.json({result:"FAIL",resultmsg:"INVALID OVER 300 LEAGUE"});
                    return;
                }
                else if(dataL[i].allGame==0){
                    console.log('INVALID data allgame 0 league');
                    res.json({result:"FAIL",resultmsg:"INVALID GAME ZERO LEAGUE"});
                    return;
                }
                else{
                    db.pool.getConnection(function(err,connection){
                        if(err){
                            console.log('error on conn pool league insert');
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            return;
                        }else{
                            connection.query('UPDATE account_has_group SET league_avg=?,league_date=now() WHERE account_a_idx=? AND group_g_idx=?',
                                [(dataL[i].allScore/dataL[i].allGame).toFixed(4),insData.aidx,dataL[i].type],function(err2,result){
                                if(err2){
                                    console.log('error on query league insert');
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    return;
                                }
                                else if(result.affectedRows==1){
                                    console.log('success, result',result);
                                }
                                connection.release();
                            });//query
                        }
                    });//conn pool
                }
            }
            else{
                console.log('error type on league data');
                res.json({result:"FAIL",resultmsg:"TYPE ERR LEAGUE"});
                return;
            }

        }
        console.log('success on league data all');
        res.json({result:"SUCESS",resultmsg:dataL});
    }
    else if(dataL.length==0){
        console.log('no data on league');
        res.json({result:"FAIL LEAGUE",resulmsg:"NO DATA LEAGUE"});
    }

};//insertScore

/*
 * 그룹 생성
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.11
 *
 * 받는 데이터 aidx , gname, gpwd, grpPhoto(사진)
 * editor : pineoc
 * */
exports.groupMake = function(req,res){
    var groupmakeData = req.body; // json data get
    var grp_photo = req.files.grpPhoto;
    var grpfilename;
    console.log('recv data grpMake : ',groupmakeData);
    var date = new Date();
    if(grp_photo!=null){
        grpfilename=grp_photo.name;
    }else{
        grpfilename = null;
    }

    var grp_id;
    var chkDup; // check duplication
    if(groupmakeData==null || groupmakeData.aidx==null|| groupmakeData.gname==null || groupmakeData.gpwd==null || groupmakeData.aidx==0 ){
        console.log('INVALID DATA of grpmake data, NULL',groupmakeData);
        res.json({result:"FAIL",resultmsg:"INVALID NULL"});
    }
    else{
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on connection pool sign check dup',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                return;
            }//error on connection pool
            else{
                connection.query('select count(*) cnt from groups where g_name=? ',[groupmakeData.gname],
                    function(err2,result){
                        if(err2){
                            console.log('error on query grp name check dup',err2);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                            return;
                        }
                        else{
                            console.log('check dup result : ',result[0].cnt);
                            chkDup = result[0].cnt;
                            if (chkDup != 0) {
                                console.log('duplication group name');
                                res.json({result: "FAIL", resultmsg: "DUP GROUP NAME"});
                                return;
                            } else {
                                async.waterfall([
                                    function (callback) {//그룹을 만든다.
                                        db.pool.getConnection(function (err, connection) {
                                            if (err) {
                                                console.log('error on connection pool makegrp on make', err);
                                                res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                                return;
                                            }//error on connection pool
                                            else {
                                                connection.query('INSERT into groups(g_name,g_pwd,g_master,g_date)values(?,?,?,now())',
                                                    [groupmakeData.gname, groupmakeData.gpwd, groupmakeData.aidx],
                                                    function (err2, result) {
                                                        if (err2) {
                                                            console.log('error on query makegrp on make', err2);
                                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR Q"});
                                                            return;
                                                        }
                                                        else if (result.affectedRows == 1) {
                                                            grp_id = result.insertId;
                                                            callback(null, {resultmsg: "success",gidx:grp_id}); // 성공 보냄
                                                        }//insert success
                                                        connection.release();
                                                    });//query
                                            }//no error on connection pool
                                        });//connection pool
                                    },
                                    function (arg1, callback) { //a_idx, g_idx 를 이용하여 account_has_group에 입력
                                        db.pool.getConnection(function (err, connection) {
                                            if (err) {
                                                console.log('error on connection pool makegrp on insert account_has_group', err);
                                                res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                                return;
                                            }//error on connection pool
                                            else {
                                                connection.query('INSERT into account_has_group(account_a_idx,group_g_idx,g_score,g_game,g_joindate)values(?,?,?,?,now())',
                                                    [groupmakeData.aidx, arg1.gidx, 0, 0], function (err2, result) {
                                                        if (err2) {
                                                            console.log('error on query makegrp on insert account has group', err2);
                                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR Q"});
                                                            return;
                                                        }
                                                        else if (result.affectedRows == 1) {
                                                            console.log('success on insert into account_has_group, result : ',result);
                                                            callback(null, {result: "SUCCESS",gidx:arg1.gidx});
                                                        }//insert success
                                                        connection.release();
                                                    });//query
                                            }//no error on connection pool
                                        });//connection pool
                                    }
                                ],
                                    function (err, results) {
                                        if (err) {//error
                                            console.log('error on grpmake async waterfall, err:', err);
                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                            return;
                                        }
                                        else {//no error
                                            console.log('data : ', results);
                                            if(grp_photo!=null){
                                            var result_upload = uploadfunction(results.gidx,"group",grp_photo);
                                                if(result_upload.result=="SUCCESS"){//file upload success
                                                    console.log(result_upload);
                                                    db.pool.getConnection(function (err, connection) {
                                                        if (err) {
                                                            console.log('error on connection pool makegrp on make file upload', err);
                                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                                            return;
                                                        }//error on connection pool
                                                        else {
                                                            connection.query('UPDATE groups SET g_photo=? where g_idx=?',
                                                                [grpfilename,results.gidx],
                                                                function (err2, result) {
                                                                    if (err2) {
                                                                        console.log('error on query makegrp on make upload file', err2);
                                                                        res.json({result: "FAIL", resultmsg: "FAIL UPLOAD"});
                                                                        return;
                                                                    }
                                                                    else if (result.affectedRows == 1) {
                                                                        console.log('success on query mkgrp on file upload',result);
                                                                        res.json({
                                                                            result:"SUCCESS",
                                                                            gidx:results.gidx,
                                                                            gname:groupmakeData.gname,
                                                                            gdate:formatDate(date)
                                                                        });
                                                                    }//insert success
                                                                    connection.release();
                                                                });//query
                                                        }//no error on connection pool
                                                    });//connection pool
                                                    //res.json(returnData);
                                                }
                                                else{//fail upload
                                                    console.log(result_upload);
                                                    res.json(result_upload);
                                                }
                                            }
                                            else{//photo null
                                                console.log('file not exist');

                                                res.json({
                                                    result:"SUCCESS",
                                                    resultmsg:"BUT NO FILE",
                                                    gidx:results.gidx,
                                                    gname:groupmakeData.gname,
                                                    gdate:formatDate(date)
                                                });
                                            }
                                        }
                                    }//last waterfall
                                );//async waterfall
                            }
                        }
                        connection.release();
                    });//query
            }
        });//connection pool
    }//check valid

};//그룹 만들기

/*
 * 그룹 가입
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.11
 *
 * 받는 데이터 aidx , gname, gpwd
 * editor : pineoc
 * */
exports.groupJoin = function(req,res){
    var grpjoinData = req.body;
    console.log('recv data grpJoin : ',grpjoinData);
    if(grpjoinData.aidx==null||grpjoinData.gname==null||grpjoinData.gpwd==null){
        console.log('invalid data of null at grpJoin');
        res.json({result:"FAIL",resultmsg:"INVALID NULL"});
        return;
    }
    else{
        async.waterfall([
            function(callback){//check g_idx use g_name
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool grp join chk gidx',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on conn pool
                    else{
                        connection.query('SELECT g_idx,g_pwd,g_date from groups where g_name=?',
                            [grpjoinData.gname],function(err2,results){
                                if(err2){
                                    console.log('error on query grp join chk gidx',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                                    return;
                                }
                                else if(results){
                                    console.log('success chk gidx : ',results);
                                    callback(null,{gidx:results[0].g_idx,gpwd:results[0].g_pwd,gdate:results[0].g_date});//gidx, gpwd 넘겨줌
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function(arg1,callback){//insert into account_has_group
                if(arg1.gpwd==grpjoinData.gpwd){ // 비밀번호가 같으면 그룹 가입
                    db.pool.getConnection(function(err,connection){
                        if(err){
                            console.log('error on connection pool grp join',err);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            return;
                        }//error on conn pool
                        else{
                            connection.query('INSERT INTO account_has_group(account_a_idx,group_g_idx,g_score,g_game,g_joindate)values(?,?,?,?,now())',
                                [grpjoinData.aidx,arg1.gidx,0,0],function(err2,results){
                                    if(err2){
                                        console.log('error on query grp join',err2);
                                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                        return;
                                    }
                                    else if(results.affectedRows==1){
                                        console.log('success : ',results);
                                        callback(null,{result:"SUCCESS",resultmsg:"success group join",gidx:arg1.gidx,gname:grpjoinData.gname});
                                    }
                                    else{
                                        console.log('error on unexpected err');
                                        res.json({result:"FAIL",resultmsg:"UNEXPECTED ERR"});
                                    }
                                    connection.release();
                                });//query
                        }
                    });//connection pool
                }
                else{
                    console.log('error, not equal gpwd',arg1.gpwd,grpjoinData.gpwd);
                    res.json({result:"FAIL",resultmsg:"PWD NOT EQUAL"});
                    return;
                }
            }
        ],function(err,result){
            if(err){
                console.log('error on grp join waterfall',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                return;
            }
            else{
                console.log('success grp join');
                res.json(result);
            }
        });//waterfall
    }
};//그룹 가입

/*
 * 그룹 리스트 불러오기
 * 최초 생성 날짜 : 2014.02.06
 * 최종 수정 날짜 : 2014.02.17
 *
 * 받는 데이터 aidx
 * editor : pineoc
 * */

exports.groupList = function(req,res){
    var grplistData = req.body;
    var arr=[];
    console.log('recv data grplist : ',grplistData);
    if(grplistData==null){
        console.log('invalid data of null in grplist');
        res.json({result:"FAIL",resultmsg:"INVALID NULL"});
    }
    else{
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on connection pool grp list',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                return;
            }//error on conn pool
            else{
                connection.query('select g.g_name gname, g.g_photo gphoto,g.g_idx gidx,DATE_FORMAT(g.g_date,"%Y-%m-%d") gdate,ag.g_joindate joindate from groups as g left outer join account_has_group as ag on g.g_idx = ag.group_g_idx where ag.group_g_idx is not null and ag.account_a_idx=? order by DATE(joindate),HOUR(joindate), MINUTE(joindate), joindate ',
                    [grplistData.aidx],function(err2,results){
                        if(err2){
                            console.log('error on query grp list',err2);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                            return;
                        }
                        else if(results){
                            console.log('success list grp : ',results);
                            for(var i=0;i<results.length;i++){
                                arr[i] = {
                                    gidx :results[i].gidx,
                                    gname:results[i].gname,
                                    gphoto:"http://bowling.pineoc.cloulu.com/uploads/group/"+results[i].gidx+"/"+results[i].gphoto,
                                    gdate:results[i].gdate
                                };
                            }//for
                            res.json({result:"SUCCESS",group:arr});
                        }
                        else{
                            console.log('no group');
                            res.json({result:"FAIL",resultmsg:"NO GROUP"});
                        }
                        connection.release();
                    });//query
            }
        });//connection pool
    }
};//그룹 리스트 조회

/*
 * 그룹 삭제
 * 최초 생성 날짜 : 2014.02.06
 * 최종 수정 날짜 : 2014.02.07
 *
 * 받는 데이터 aidx, gidx,
 * editor : pineoc
 * */
exports.groupDelete = function(req,res){
    /*
    * 1. 그룹원일 경우 account_has_group에서 그 그룹원만 지운다( 탈퇴 )
    * 2. 그룹장이 탈퇴 하면 그룹원 탈퇴하듯이 탈퇴하되 master는 다음 회원이 master
    * 3. 그룹원이 없을경우 그룹테이블에서 그룹을 지운다.
    * */
    var grpdelData = req.body; // aidx, gidx 를 받아온다
     async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on pool chk grp member',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('SELECT count(*) cnt from account_has_group where account_a_idx=? and group_g_idx=?',
                        [grpdelData.aidx,grpdelData.gidx],function(err2,result){
                            if(err2){
                                console.log('error on query chk grp member',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else{
                                console.log('success chk grp member n : ',result[0].cnt);//그룹원 수 출력
                                callback(null,result[0].cnt);
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        },
        function(arg1,callback){//check master
            var account_email;
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on pool chk grp master account',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('SELECT count(*) cnt from groups where g_master=? ',
                        [grpdelData.aidx],function(err2,result){
                            if(err2){
                                console.log('error on query chk grp master account',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else{
                                console.log('success chk grp g_master : ',result[0].cnt);//마스터 여부 출력
                                if(result[0].cnt !=0){
                                    callback(null,{cnt:arg1,result:"master"});
                                }
                                else{
                                    callback(null,{cnt:arg1,result:"member"});
                                }
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        },
        function(arg2,callback){
            if(arg2.cnt!=1){
                if(arg2.result=="master"){
                    var updateAidx;
                    db.pool.getConnection(function(err,connection){
                        if(err){
                            console.log('error on pool grp master del',err);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            return;
                        }else{
                            connection.query('DELETE FROM account_has_group a_idx=? and g_idx=?',
                                [grpdelData.aidx,grpdelData.gidx],function(err2,result){
                                    if(err2){
                                        console.log('error on query grp master del',err2);
                                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                        return;
                                    }
                                    else{
                                        console.log('success grp master email : ',result);//그룹원 수 출력
                                        db.pool.getConnection(function(err,connection){
                                            if(err){
                                                console.log('error on pool grp master change select',err);
                                                res.json({result:"FAIL",resultmsg:"NETWORK ERR "});
                                                return;
                                            }else{
                                                connection.query('SELECT account_a_idx FROM account_has_group where group_g_idx=?',
                                                    [grpdelData.gidx],function(err2,result){
                                                        if(err2){
                                                            console.log('error on query grp master change select',err2);
                                                            res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                                            return;
                                                        }
                                                        else{
                                                            console.log('success grp master change select : ',result[0].account_a_idx);
                                                            //res.json({result:"SUCCESS",resultmsg:"CHANGE SUCCESS"});
                                                            updateAidx = result[0].account_a_idx;
                                                            db.pool.getConnection(function(err,connection){
                                                                if(err){
                                                                    console.log('error on pool grp member del update',err);
                                                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                                                                    return;
                                                                }else{
                                                                    connection.query('UPDATE groups set g_master=? where and g_idx=?',
                                                                        [updateAidx,grpdelData.gidx],function(err2,result){
                                                                            if(err2){
                                                                                console.log('error on query grp member del update',err2);
                                                                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                                                                return;
                                                                            }
                                                                            else{
                                                                                console.log('success grp master del update: ',result);//update
                                                                                //res.json({result:"SUCCESS",resultmsg:"DELETE SUCCESS"});
                                                                                callback(null,{result:"SUCCESS",resultmsg:"DELETE SUCCESS"});
                                                                            }
                                                                            connection.release();
                                                                        });//query
                                                                }
                                                            });//connection pool
                                                        }
                                                        connection.release();
                                                    });//query
                                            }
                                        });//connection pool
                                    }
                                    connection.release();
                                });//query
                        }
                    });//connection pool

                }
                else if(arg2.result=="member"){
                    db.pool.getConnection(function(err,connection){
                        if(err){
                            console.log('error on pool grp member del',err);
                            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            return;
                        }else{
                            connection.query('DELETE FROM account_has_group account_a_idx=? and group_g_idx=?',
                                [grpdelData.aidx,grpdelData.gidx],function(err2,result){
                                    if(err2){
                                        console.log('error on query grp member del',err2);
                                        res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                        return;
                                    }
                                    else{
                                        console.log('success grp member del : ',result);//그룹원 수 출력
                                        res.json({result:"SUCCESS",resultmsg:"DELETE SUCCESS"});
                                    }
                                    callback(null,{result:"SUCCESS"});
                                    connection.release();
                                });//query
                        }
                    });//connection pool
                }
                else{
                    console.log('not master or member');
                    res.json({result:"FAIL",resultmsg:"UNEXPECTED ERR"});
                    return;
                }
            }
            else{// count =1, 그룹 삭제
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on pool grp member del',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }else{
                        connection.query('DELETE FROM account_has_group where account_a_idx=? and group_g_idx=?',
                            [grpdelData.aidx,grpdelData.gidx],function(err2,result){
                                if(err2){
                                    console.log('error on query grp member del',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    return;
                                }
                                else{
                                    console.log('success grp meber del : ',result);//그룹원 수 출력
                                    res.json({result:"SUCCESS",resultmsg:"DELETE SUCCESS"});
                                }
                                callback(null,{result:"SUCCESS"});
                                connection.release();
                            });//query
                    }
                });//connection pool
            }
        }
    ],function(err,result){
         if(result.result=="SUCCESS"){
             console.log('success on waterfall result',result);
             res.json({result:"SUCCESS",resultmsg:"DEL SUCCESS"});
         }
         else{
             console.log('fail on waterfall result',result);
             res.json({result:"FAIL",resultmsg:"DEL FAIL"});
         }
    });//waterfall

};//그룹 삭제

    /*
     * 그룹 찾기
     * 최초 생성 날짜 : 2014.02.09
     * 최종 수정 날짜 : 2014.02.09
     *
     * 받는 데이터 groupname ( gname )
     * editor : pineoc
     * */
exports.groupsearch = function(req,res){
    var grpsearchData = req.body;
    var arr=[];
    console.log('recv data grpSearch : ',grpsearchData);
    async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on grp search conn pool w1');
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('SELECT g_idx,g_name,g_photo,g_master,DATE_FORMAT(g_date,"%Y-%m-%d") g_date from groups where g_name=?',[grpsearchData.gname],
                        function(err2,result){
                            if(err2){
                                console.log('error on grp search query');
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else if(result.length!=0){
                                for(var i=0;i<result.length;i++){
                                    arr[i] = {
                                        gidx:result[i].g_idx,
                                        gname:result[i].g_name,
                                        gphoto:result[i].g_photo,
                                        gmaster:result[i].g_master,
                                        gdate:result[i].g_date
                                    };
                                }//for arr
                                console.log('result of w1 : ',arr);
                                callback(null,arr);
                            }
                            else{
                                console.log('nothing on grp search : ',result);
                                res.json({result:"FAIL",resultmsg:"NO SEARCH GROUP"});
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        },
        function(arg1,callback){
            var arr2 = []; // g_master name arr
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on grp search conn pool w2');
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('select name from account left outer join groups on account.a_idx=groups.g_master where groups.g_idx is not null and groups.g_name=?',
                        [grpsearchData.gname],function(err2,result){
                            if(err2){
                                console.log('error on grp search query w2');
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else if(result.length!=0){
                                for(var i=0;i<result.length;i++){
                                    arr2[i] = {
                                        gname:arg1[i].gname,
                                        gphoto:"http://bowling.pineoc.cloulu.com/uploads/group/"+arg1[i].gidx+"/"+arg1[i].gphoto,
                                        gmaster:result[i].name,
                                        gdate:arg1[i].gdate
                                    };
                                }//for arr
                                callback(null,arr2);
                            }
                            else{
                                console.log('nothing on grp search w2: ',result);
                                res.json({result:"FAIL",resultmsg:"NO SEARCH GROUP"});
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        }
    ],
        function(err,result){
            if(err){
                console.log('error on grp search waterfall',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                return;
            }
            else{
                console.log('result of search : ',result);
                res.json({result:"SUCCESS",resultmsg:"SUCCESS SEARCH",arr:result});
            }
        }
    );//waterfall
};//group search

/*
 * 그룹 멤버
 * 최초 생성 날짜 : 2014.02.14
 * 최종 수정 날짜 : 2014.02.18
 *
 * 받는 데이터 aidx,gidx
 * editor : pineoc
 * */
exports.groupmember = function(req,res){
    var grpmemData = req.body;
    var arr = [];
    console.log('recv data grpMem : ',grpmemData);
    async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool on grpmem',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }
                else{
                    connection.query('SELECT * from account where a_idx in (select account_a_idx from account_has_group where group_g_idx=?)',
                        [grpmemData.gidx],function(err2,result){
                            if(err2){
                                console.log('error on query on grpmem',err);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else{
                                console.log('success on grpmem result : ',result);
                                for(var i=0;i<result.length;i++){
                                    var link;
                                    if(result[i].prophoto==null){
                                        link = "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png";
                                    }
                                    else{
                                        link = "http://bowling.pineoc.cloulu.com/uploads/user/"+result[i].a_idx+"/"+result[i].prophoto;
                                    }
                                    arr[i]={
                                        name : result[i].name,
                                        country : result[i].country,
                                        proPhoto : link,
                                        ballPhoto : result[i].ballphoto,
                                        avg : (result[i].allscore/result[i].allgame).toFixed(1),
                                        allhighScore : result[i].all_highscore,//지금까지의 최고점수
                                        highscore : result[i].highscore,//그주의 최고점수
                                        hand : result[i].hand,
                                        style : result[i].style,
                                        step : result[i].step,
                                        series300 : result[i].series300,
                                        series800 : result[i].series800
                                    };
                                }
                                callback(null,{member:arr});
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        },
        function(arg,callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool on grpmem take me',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }
                else{
                    connection.query('SELECT prophoto from account where a_idx=?',
                        [grpmemData.aidx],function(err2,result){
                            if(err2){
                                console.log('error on query on grpmem take me',err);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                return;
                            }
                            else{
                                console.log('success on grpmem result : ',result);
                                callback(null,{
                                    result:"SUCCESS",
                                    resultmsg:"SUCCESS GRPMEM",
                                    proPhoto: result[0].prophoto==null ? "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png" : "http://bowling.pineoc.cloulu.com/uploads/user/"+leagueData.aidx+"/"+result[0].prophoto,
                                    member:arg.member});
                            }
                            connection.release();
                        });//query
                }
            });//connection pool

        }
    ],
        function(err,result){
            if(err){
                console.log('error on waterfall grpmem',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
            }
            else{
                console.log('success,',result);
                res.json(result);
            }

        }
    );//waterfall

};

/*
 * 그룹 리그
 * 최초 생성 날짜 : 2014.02.18
 * 최종 수정 날짜 : 2014.02.18
 *
 * 받는 데이터 gidx
 * editor : pineoc
 * */
exports.groupLeague = function(req,res){
    var leagueData = req.body;
    console.log('recv data on league : ',leagueData);
    async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool group rank',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }//error on connection pool
                else{
                    connection.query('SELECT a.a_idx,a.name,a.prophoto,ag.league_avg l_avg from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=? order by l_avg desc',
                        [leagueData.gidx],
                        function(err2,results){
                            if(err2){
                                console.log('error on query league rank',err2);
                                res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                return;
                            }
                            else if(results.length){
                                callback(null,{results:results});//data
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                                return;
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        },
        function(arg,callback){
            var arr = [];
            for(var i=0;i<arg.results.length;i++){
                var link;
                if(arg.results[i].prophoto==null){
                    link = "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png";
                }
                else{
                    link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg.results[i].a_idx+"/"+arg.results[i].prophoto;
                }
                arr[i] = {
                    name : arg.results[i].name,
                    prophoto : link,
                    avg : (arg.results[i].l_avg==null || arg.results[i].l_avg==0) ? 0 : (arg.results[i].l_avg).toFixed(1)
                };
            }
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool group rank all avg',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }//error on connection pool
                else{
                    connection.query('select AVG(league_avg) allavg from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=?',
                        [leagueData.gidx],
                        function(err2,results){
                            if(err2){
                                console.log('error on query league rank all avg',err2);
                                res.json({result:"FAIL",resultmsg:"SORTING ERR Q"});
                                return;
                            }
                            else if(results.length){
                                callback(null,{arr:arr,allavg:(results[0].allavg==null || results[0].allavg==null) ? 0 : (results[0].allavg).toFixed(1)});
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                                return;
                            }
                            connection.release();
                        });//query
                }
            });//connection pool

        }
    ],function(err,result){
        if(err){
            console.log('error on waterfall on league',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
        }
        else{
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool group rank',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }//error on connection pool
                else{
                    connection.query('select a.prophoto prophoto,ag.league_avg l_avg from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=? and ag.account_a_idx=? ',
                        [leagueData.gidx,leagueData.aidx],
                        function(err2,results){
                            if(err2){
                                console.log('error on query league rank',err2);
                                res.json({result:"FAIL",resultmsg:"SORTING ERR Q"});
                                return;
                            }
                            else if(results.length){
                                console.log('last waterfall on league',result);
                                res.json({
                                    result:"SUCCESS",
                                    resultmsg:"SUCCESS LEAGUE",
                                    proPhoto:results[0].prophoto==null ? "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png" : "http://bowling.pineoc.cloulu.com/uploads/user/"+leagueData.aidx+"/"+results[0].prophoto,
                                    myavg : results[0].l_avg,
                                    allavg:result.allavg,
                                    leaguedata:result.arr});
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                                return;
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        }
    });//waterfall
};//group league

exports.deletePhoto = function(req,res){

};//사진 삭제