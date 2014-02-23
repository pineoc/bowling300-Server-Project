/*
 by pineoc
 pineoc@naver.com
 content : testing
 2014.02.03 - start
 * */

//var db = require('./localDB');
var db = require('./clouluDB');
var cry = require('./crypto_pineoc');

var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var mkdirp = require('mkdirp');
var hash_int = require('hash-int');
var uploadFunc = function(data){

};

/*
 * delete function
 * 최초 생성 날짜 : 2014.02.17
 * 최종 수정 날짜 : 2014.02.23
 *
 * 받는 데이터 aidx, type
 * editor : pineoc
 * */

function deletePhoto(aidx,type,cb){
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
                                    connection.query('UPDATE account SET prophoto=null where a_idx=?',[aidx],function(err3,result){
                                        if(err3){
                                            console.log('error on update prophoto after delete',err3);
                                            connection.release();
                                            return -1;
                                        }
                                        else{
                                            console.log('success on update proname null');
                                        }
                                    });
                                    retval=1;
                                    cb(retval);
                                }
                            });
                        }
                        else{
                            console.log('null prophoto name',result[0].prophoto);
                            retval=-1;
                            console.log('retval : ',retval);
                            cb(retval);
                        }
                    }
                    else{
                        console.log('no data del prophoto get prophoto name');
                        retval = -1;
                        cb(retval);
                    }
                    connection.release();
                });//query
            }
        });//connection pool

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
                                    cb(retval);
                                }
                            });
                        }
                        else{
                            console.log('null ballphoto name',result[0].ballphoto);
                            retval=-1;
                            cb(retval);
                        }
                    }
                    else{
                        console.log('no dataa on get ballphoto name');
                        retval = -1;
                        cb(retval);
                    }
                    connection.release();
                });//query
            }
        });//connection pool
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
                        connection.release();
                        retval=-1;
                        return;
                    }
                    else if (result){
                        console.log('Success get grpphoto name : ',result[0].g_photo);
                        var userfolder = path.resolve(process.env.UPLOAD_PATH,'group',aidx);
                        if(result[0].g_photo==null){
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
        cb(retval);
    }
    else{
        console.log('del function type error');
        cb(-1);
    }
}


/*
 * test page
 * 최초 생성 날짜 : 2014.02.09
 * 최종 수정 날짜 : 2014.02.09
 *
 * 받는 데이터 : 사진file ( req.files 로 받음) 변수명 prophoto, aidx
 * editor : pineoc
 * */
if(process.env.UPLOAD_PATH == undefined)
{
    process.env.UPLOAD_PATH = 'test';
}//if =local

 exports.upload = function(req, res){
    var uploadData = req.files.upfile;
    var a_idx = req.body.aidx;
    if(uploadData.originalFilename!=''){
        var userfolder = path.resolve(process.env.UPLOAD_PATH,'country');
        console.log('userfolder : ',userfolder);
        if(!fs.existsSync(userfolder)){
            mkdirp(userfolder,function(err){
                if(err){
                    console.log('error on mkdirp make dir',err);
                    res.json({result:"FAIL",resultmsg:"FAIL MKDIR"});
                }else{
                    console.log('success');
                }
            });//mkdirp
        }

        var name = uploadData.name;//upload file name ex>file.jpg
        var srcpath = uploadData.path;//현재 폴더 위치 -> 업로드 하는 기기
        var destpath = path.resolve(__dirname,'..',userfolder,name);//public/1/이미지.jpg
        var checkext = path.extname(name);
        checkext=checkext.toLowerCase();
        console.log(destpath);
        console.log(checkext);

        //check image ext
        if(checkext=='.jpg' || checkext=='.jpeg' || checkext=='.png' ){
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
            console.log('success',{result:"SUCCESS",resultmsg:"FILE UPLOAD SUCCESS"});
            res.json({result:"SUCCESS",resultmsg:"FILE UPLOAD SUCCESS"});
        }
        else{
            console.log('invalid file image');
            res.json({result:"FAIL",resultmsg:"INVALID"});
        }
    }
    else
    {
        console.log('error on no file');
        res.json({result:"FAIL",resultmsg:"NO FILE EXISTS"});
    }
};

exports.testenc = function(req,res){
    var data = req.body;
    var enc = cry.encryption(data.idx);
    console.log('enc, hex to integer : ',parseInt(enc,16));
    var dec = cry.decryption(enc);
    var hash_enc = hash_int(enc);
    var hash_dec = hash_int(dec);
    var b = cry.encB(data.idx);
    res.json({enc:enc,dec:dec,henc:hash_enc,denc:hash_dec,encB:b,decB:cry.decB(b)});
};

exports.testdel = function(req,res){
    var data = req.body;
    var bit;
    console.log('recv data : ',data);

    deletePhoto(data.aidx,"pro",function(val){
        bit = val;
        console.log(val);
    });
    console.log('delbit : ',bit);

    if(bit==1){
        res.json({result:"SUCCESS"});
    }
    else{
        res.json({result:"FAIL"});
    }
};