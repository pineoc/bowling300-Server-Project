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

/*
 * test page
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.02
 *
 * 받는 데이터 no
 * editor : pineoc
 * */

exports.list = function(req, res){
  res.send("respond with a resource");
};
/*
* 기능 : 회원가입 ( 기본정보 )
* 최초 생성 날짜 : 2014.02.02
* 최종 수정 날짜 : 2014.02.05
*
* editor : pineoc
* 미구현 부분 : 사진 파일 업로드 부분
* */

 exports.sign = function(req,res){
    var signData = req.body; // 입력할 json 데이터 받을 변수
    console.log(req.body);
    //사진 파일 업로드 부분 현재
    //
     var chkDup;
    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on connection pool sign check dup',err);
            res.json({result:"FAIL",result_msg:"NETWORK ERR"});
        }//error on connection pool
        else{
            //console.log('data : ',signData,signData.email,signData.name,signData.pwd);
            connection.query('select count(*) cnt from account where email=?',[signData.email],
                function(err2,result){
                if(err2){
                    console.log('error on query sign check dup',err2);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
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
                            }//error on connection pool
                            else {
                                connection.query('insert into account(email,name,pwd,all_highscore,allscore,allgame,highscore) values(?,?,?,?,?,?,?)',
                                    [signData.email, signData.name, signData.pwd,0,0,0,0], function (err2, result) {
                                        if (err2) {
                                            console.log('error on query sign', err2);
                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                        }
                                        else if (result.affectedRows == 1) {
                                            console.log('sign result : ', result);
                                            returnData = {result: "SUCCESS", aidx: result.insertId};
                                            res.json(returnData);
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
};

/*
 * 기능 : 회원 정보 추가 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.05
 *
 * editor : pineoc
 * 미구현 부분 : 사진 파일 업로드 부분
 * */
exports.addsign = function(req,res){
    var addSignData = req.body; // json data
};

/*
 * 점수 데이터 입력
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.05
 *
 * 받는 데이터 aidx , data(점수)
 * editor : pineoc
 * 미구현 부분 : 사진 파일 업로드 부분
 * */
exports.insertScore = function(req,res){
    var insData = req.body; // 입력할 데이터를 받음
    var dataLength = insData.data.length;
    var aidx = parseInt(insData.aidx);
    var s_allScore = 0;
    var s_allGame = 0;
    console.log('req.body : ',insData);
    console.log('datalength: ',dataLength);
    console.log('data : ',aidx,insData.data.length);
    if(dataLength!=0){
        for(var i=0;i<dataLength;i++){
            if(insData.data[i].type=="solo"){
                s_allScore = insData.data[i].allScore;
                s_allGame = insData.data[i].allGame;
                console.log('s_data :',s_allGame,s_allScore );

                //update to db-------------------------------------------------
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool insert',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('UPDATE account SET allscore=?, allgame=? WHERE a_idx=?',
                            [s_allScore,s_allGame,aidx],function(err2,result){
                                if(err2){
                                    console.log('error on query insert solo',err2);
                                    res.json({result:"FAIL",resultmsg:"INVALID"});
                                }
                                else if(result.affectedRows==1){
                                    console.log('result',result);
                                    res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                }//insert success
                                connection.release();
                        });//query
                    }//no error on connection pool
                });//connection pool
                //-------------------------------------------------------------
            }//solo data
            else{
                var grpIdx = insData.data[i].type;
                var grpScore = insData.data[i].allScore;
                var grpGame = insData.data[i].allGame;
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool group',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('UPDATE account_has_group SET g_score=?,g_game=? WHERE a_idx=? and g_idx=?',
                            [grpScore,grpGame,aidx,grpIdx],function(err2,result){
                                if(err2){
                                    console.log('error on query insert grp',err2);
                                    res.json({result:"FAIL",resultmsg:"INVALID"});
                                }//error on query
                                else if(result.affectedRows==1){
                                    res.json({result:"SUCCESS",resultmsg:insData}); // result_msg에 대한 부분은 차후 수정
                                }//insert success
                                connection.release();
                            });//query
                    }//no error on connection pool
                });//connection pool
            }//group data
        }//for
    }//if end
    else{
        console.log('error, no data ');
        res.json({result:"FAIL",resultmsg:"NO DATA"});
    }//no data
};//insertScore


/*
 * 그룹 생성
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.05
 *
 * 받는 데이터 aidx , gname, gpwd, gPhoto(사진)
 * editor : pineoc
 * 미구현 부분 : 사진 파일 업로드 부분
 * */
exports.groupMake = function(req,res){
    var groupmakeData = req.body; // json data get

    //var grp_photo=req.files;
    var grp_id;
    var chkDup; // check duplication
    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on connection pool sign check dup',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
        }//error on connection pool
        else{
            //console.log('data : ',signData,email,name,pwd);
            connection.query('select count(*) cnt from groups where g_name=? ',[groupmakeData.gname],
                function(err2,result){
                    if(err2){
                        console.log('error on query grp name check dup',err2);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }
                    else{
                        console.log('check dup result : ',result[0].cnt);
                        chkDup = result[0].cnt;
                        if (chkDup != 0) {
                            console.log('duplication group name');
                            res.json({result: "FAIL", resultmsg: "DUP GROUP NAME"});
                        } else {
                            async.waterfall([
                                function(callback){
                                    db.pool.getConnection(function (err, connection) {
                                        if (err) {
                                            console.log('error on connection pool makegrp getemail', err);
                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                        }//error on connection pool
                                        else {
                                            connection.query('SELECT email from account where a_idx=?',
                                                [groupmakeData.aidx],
                                                function (err2, result) {
                                                    if (err2) {
                                                        console.log('error on query makegrp on make', err2);
                                                        res.json({result: "FAIL", result_msg: "INVALID"});
                                                    }
                                                    else if (result) {
                                                        callback(null,{gemail:result[0].email});
                                                    }//insert success
                                                    connection.release();
                                                });//query
                                        }//no error on connection pool
                                    });//connection pool
                                },
                                function (arg,callback) {//그룹을 만든다.
                                    db.pool.getConnection(function (err, connection) {
                                        if (err) {
                                            console.log('error on connection pool makegrp on make', err);
                                            res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                        }//error on connection pool
                                        else {
                                            connection.query('INSERT into groups(g_name,g_pwd,g_master)values(?,?,?)',
                                                [groupmakeData.gname, groupmakeData.gpwd, arg.gemail],
                                                function (err2, result) {
                                                    if (err2) {
                                                        console.log('error on query makegrp on make', err2);
                                                        res.json({result: "FAIL", result_msg: "INVALID"});
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
                                        }//error on connection pool
                                        else {
                                            connection.query('INSERT into account_has_group(account_a_idx,group_g_idx,g_score,g_game)values(?,?,?,?)',
                                                [groupmakeData.aidx, arg1.gidx, 0, 0], function (err2, result) {
                                                    if (err2) {
                                                        console.log('error on query makegrp on insert account has group', err2);
                                                        res.json({result: "FAIL", resultmsg: "INVALID"});
                                                    }
                                                    else if (result.affectedRows == 1) {
                                                        //res.json({result:"SUCCESS",result_msg:result}); // result_msg에 대한 부분은 차후 수정
                                                        callback(null, {result: "SUCCESS"});
                                                    }//insert success
                                                    connection.release();
                                                });//query
                                        }//no error on connection pool
                                    });//connection pool
                                }
                            ],
                                function (err, results) {
                                    if (err) {
                                        console.log('error on grpmake async waterfall', err);
                                        res.json({result: "FAIL", resultmsg: "NETWORK ERR"});
                                    }
                                    else {
                                        console.log('data : ', results);
                                        res.json(results);
                                    }
                                }
                            );//async waterfall
                        }
                    }
                    connection.release();
                });//query
        }
    });//connection pool

};//그룹 만들기

/*
 * 그룹 가입
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.06
 *
 * 받는 데이터 aidx , gname, gpwd
 * editor : pineoc
 * */
exports.groupJoin = function(req,res){
    var grpjoinData = req.body;

    async.waterfall([
        function(callback){//check g_idx use g_name
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool grp join chk gidx',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                }//error on conn pool
                else{
                    connection.query('SELECT g_idx,g_pwd from groups where g_name=?',
                        [grpjoinData.gname],function(err2,results){
                            if(err2){
                                console.log('error on query grp join chk gidx',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                            }
                            else if(results){
                                console.log('success chk gidx : ',results);
                                callback(null,{gidx:results[0].g_idx,gpwd:results[0].g_pwd});//gidx, gpwd 넘겨줌
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
                    }//error on conn pool
                    else{
                        connection.query('INSERT INTO account_has_group(account_a_idx,group_g_idx,g_score,g_game)values(?,?,?,?)',
                            [grpjoinData.aidx,arg1.gidx,0,0],function(err2,results){
                                if(err2){
                                    console.log('error on query grp join',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                                }
                                else if(results.affectedRows==1){
                                    console.log('success : ',results);
                                    callback(null,{result:"SUCCESS",resultmsg:"success group join",gidx:arg1.gidx});
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
                res.json({result:"FAIL",resultmsg:"PWD NOT EQUAL"})
            }
        }
    ],function(err,result){
        if(err){
            console.log('error on grp join waterfall');
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
        }
        else{
            console.log('success grp join');
            res.json(result);
        }
    });//waterfall
};//그룹 가입

/*
 * 그룹 리스트 불러오기
 * 최초 생성 날짜 : 2014.02.06
 * 최종 수정 날짜 : 2014.02.06
 *
 * 받는 데이터 aidx
 * editor : pineoc
 * */

exports.groupList = function(req,res){
    var grplistData = req.body;
    var arr=[];
    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on connection pool grp list',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
        }//error on conn pool
        else{
            connection.query('SELECT g_name gname, g_photo gphoto FROM groups WHERE g_idx IN (SELECT group_g_idx FROM account_has_group WHERE account_a_idx=?)',
                [grplistData.aidx],function(err2,results){
                    if(err2){
                        console.log('error on query grp list',err2);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }
                    else if(results){
                        console.log('success list grp : ',results);
                        for(var i=0;i<results.length;i++){
                            arr[i] = {gname:results[i].gname,gphoto:results[i].gphoto};
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

};//그룹 리스트 조회

/*
 * 그룹 삭제
 * 최초 생성 날짜 : 2014.02.06
 * 최종 수정 날짜 : 2014.02.06
 *
 * 받는 데이터 aidx , gname, gpwd
 * editor : pineoc
 * */
exports.groupDelete = function(req,res){
    /*
    * 1. 그룹원일 경우 account_has_group에서 그 그룹원만 지운다( 탈퇴 )
    * 2. 그룹장일 경우 account_has_group에 있는 같은 그룹원들의 데이터가 모두 삭제 ( 그룹 삭제 )
    * 3. 그룹장이 탈퇴 하더라도 그룹이 삭제 되지 않는 경우(고려중)
    * */

};//그룹 삭제

if(process.env.UPLOAD_PATH == undefined)
{
    process.env.UPLOAD_PATH = 'photo';
}//if =local

exports.uploadPhoto = function(req,res){
    var type = req.body.type;
    var upfile = req.files.upfile;
    var userid = req.params.a_idx;
    if(upfile.originalFilename!=''){
        var userfolder = path.resolve(process.env.UPLOAD_PATH,userid);
        console.log('userfolder : ',userfolder);
        if(!fs.existsSync(userfolder)){
            fs.mkdirSync(userfolder);
        }

        var name = upfile.name;//upload file name ex>file.jpg
        var srcpath = upfile.path;//현재 폴더 위치 -> 업로드 하는 기기
        var destpath = path.resolve(__dirname,'..',userfolder,name);
        //public/1/이미지.jpg
        var is = fs.createReadStream(srcpath);
        //소스로부터 스트림을 입력받음
        var os = fs.createWriteStream(destpath);
        //읽어온 스트림을 통해서 사진파일 생성
        is.pipe(os);
        is.on('end',function(){
            fs.unlinkSync(srcpath);
            var srcimg = destpath;
            var idx = destpath.lastIndexOf('.');
            var ext = destpath.substring(idx); // .jpg
            var filename = destpath.substring(0,idx);
            var destimg = filename + '-thumnail'+ext;
            //c:~\public\lee\koala + '-thumnail'+.jpg

            easyimage.resize({src:srcimg,dst:destimg,
                width:100,height:100},function(err,image){
                if(err) {
                    console.log('err',err);
                }
                else{
                    console.log('image',image);
                    res.json({result:'SUCCESS',image:image});
                }
            }); //function easyimage resize

        });//is.on callback function
    }
    else{
        res.json({result:'FAIL',result_msg:'FILE NOT EXISTS'});
    }
};//사진 올리기

exports.deletePhoto = function(req,res){

};//사진 삭제