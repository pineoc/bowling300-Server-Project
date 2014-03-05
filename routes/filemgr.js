/**
 * Created by pineoc on 14. 3. 3.
 */
//var db = require('./localDB.js');
var db = require('./clouluDB.js');
var cry = require('./crypto_pineoc.js');


var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var util = require('util');
var mkdirp = require('mkdirp');

var uploadfunction;
var deletefunction;

/*
 * upload function
 * 최초 생성 날짜 : 2014.02.17
 * 최종 수정 날짜 : 2014.03.03
 *
 * 받는 데이터 aidx, type, file
 * editor : pineoc
 * */
uploadfunction = function(userid,type,upfile){
    var name=upfile.name;//upload file name ex>file.jpg
    var srcpath = upfile.path;//현재 폴더 위치 -> 업로드 하는 기기
    var destpath;

    if(upfile.originalFilename!=''){
        if(type=="profile"){
            var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',userid.toString());//aidx를 이용
            console.log('userfolder : ',userfolder);
            if(!fs.existsSync(userfolder)){
                mkdirp(userfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make userdir',err);
                        return {result:"FAIL",resultmsg:"MKDIR FAIL"};
                    }else{
                        console.log('success path load pro');
                    }
                });//mkdirp
            }
            destpath = path.resolve(__dirname,'..',userfolder,name);
        }
        else if(type=="group"){
            var groupfolder = path.resolve(process.env.UPLOAD_PATH,'group',userid.toString());//gidx를 이용
            console.log('groupfolder : ',groupfolder);
            if(!fs.existsSync(groupfolder)){
                //fs.mkdirSync(userfolder);
                mkdirp(groupfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make groupdir',err);
                        return {result:"FAIL",resultmsg:"FAIL MKDIR"};
                    }else{
                        console.log('success path load grp');
                    }
                });//mkdirp
            }
            destpath = path.resolve(__dirname,'..',groupfolder,name);
        }
        else if(type=="ball"){
            var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',userid.toString());//gidx를 이용
            console.log('groupfolder : ',groupfolder);
            if(!fs.existsSync(groupfolder)){
                mkdirp(groupfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make balldir',err);
                        return {result:"FAIL",resultmsg:"FAIL MKDIR"};
                    }else{
                        console.log('success path load ball');
                    }
                });//mkdirp
            }
            destpath = path.resolve(__dirname,'..',groupfolder,name);
        }
        else if(type=="board"){
            console.log('board');
            var groupfolder = path.resolve(process.env.UPLOAD_PATH,'group',userid.toString(),'board');//gidx를 이용
            console.log('groupboard folder : ',groupfolder);
            if(!fs.existsSync(groupfolder)){
                mkdirp(groupfolder,function(err){
                    if(err){
                        console.log('error on mkdirp make grpboard dir',err);
                        return {result:"FAIL",resultmsg:"FAIL MKDIR"};
                    }else{
                        console.log('success path load board');
                    }
                });//mkdirp
            }
            destpath = path.resolve(__dirname,'..',groupfolder,name);
        }
        console.log('path : ',destpath);
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
            console.log('success on save file');
            return {result:"SUCCESS",resultmsg:"UPLOAD SUCCESS"};
        }
        else{//invalid data type
            console.log('invalid file image');
            return {result:"FAIL",resultmsg:"INVALID EXT"};
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
 * 최종 수정 날짜 : 2014.02.23
 *
 * 받는 데이터 aidx, type
 * editor : pineoc
 * */

deletefunction = function(aidx,type){
    var retval;
    if(type=="pro"){
        db.pool.getConnection(function(err,connection){
            if(err){
                console.log('error on conn pool del prophoto',err);
                //res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                retval=-1;
                return retval;
            }else{
                connection.query('SELECT prophoto from account where a_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del prophoto',err2);
                        connection.release();
                        retval=-1;
                        return retval;
                    }
                    else if(result){
                        console.log('success get prophoto name:',result[0].prophoto);
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'user',aidx);
                        if(result[0].prophoto!=null){
                            fs.unlink(userfolder+"/"+result[0].prophoto, function (err) {
                                if (err){
                                    console.log('error on delete file',err);
                                    retval=-1;
                                    return retval;
                                }else{
                                    console.log('successfully deleted',userfolder);
                                    retval=1;
                                }
                            });
                        }
                        else{
                            console.log('null prophoto name',result[0].prophoto);
                            retval=-1;
                        }
                    }
                    else{
                        console.log('no data del prophoto get prophoto name');
                        retval = -1;
                    }
                    connection.release();
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
                return retval;
            }else{
                connection.query('SELECT ballphoto from account where a_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del ballphoto',err);
                        //res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        connection.release();
                        retval=-1;
                        return;
                    }
                    else if (result){
                        console.log('success get ballPhoto name : ',result[0].ballphoto);
                        if(result[0].ballphoto!=null){
                            fs.unlink(userfolder+"/"+result[0].ballphoto, function (err) {
                                if (err){
                                    console.log('error on delete file',err);
                                    retval=-1;
                                    return retval;
                                }else{
                                    console.log('successfully deleted',userfolder);
                                    retval=1;
                                }
                            });
                        }
                        else{
                            console.log('null ballphoto name',result[0].ballphoto);
                            retval=-1;
                        }
                    }
                    else{
                        console.log('no dataa on get ballphoto name');
                        retval = -1;
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
                return retval;
            }else{
                connection.query('SELECT g_photo from groups where g_idx=?',[aidx],function(err2,result){
                    if(err2){
                        console.log('error on query del grpphoto',err);
                        //res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                        connection.release();
                        retval=-1;
                        return retval;
                    }
                    else if (result){
                        console.log('Success get grpphoto name : ',result[0].g_photo);
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'group',aidx);
                        if(result[0].g_photo==null){
                            fs.unlink(userfolder+"/"+result[0].g_photo, function (err) {
                                if (err){
                                    console.log('error on delete file',err);
                                    retval=-1;
                                    return retval;
                                }else{
                                    console.log('successfully deleted',userfolder);
                                    retval=1;
                                }
                            });
                        }
                        else{
                            console.log('null grp photo name',result[0].g_photo);
                            retval=-1;
                        }
                    }
                    else{
                        console.log('no data on get grpphoto name');
                        retval = -1;
                    }
                    connection.release();
                });//query
            }
        });//connection pool
        return retval;
    }
    else{
        console.log('del function type error');
        return -1;
    }
}

module.exports.uploadfunction = uploadfunction;
module.exports.deletefunction = deletefunction;