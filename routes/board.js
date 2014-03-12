/*
 by pineoc
 pineoc@naver.com
 content : board
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

var boardlink = "http://bowling.pineoc.cloulu.com/uploads/group/";



/*
 * 글 목록
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx,limit
 * editor : pineoc
 * */
exports.boardList = function(req,res){
    var listdata = req.body;
    var arr = [];
    console.log('recv data board list data : ',listdata);

    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on boardlist err: ',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
            return;
        }
        else{
            connection.query('SELECT * FROM board where group_g_idx=? limit ?,10',[parseInt(listdata.gidx),parseInt(listdata.limit)],function(err2,result){
                if(err2){
                    console.log('error on boardlist query',err2);
                    res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                    connection.release();
                    return;
                }
                else if(result.length){
                    console.log('success select board list');
                    for(var i=0;i<result.length;i++){
                        console.log(result[i].picture);
                        arr[i] = {
                            bidx : result[i].b_idx,
                            title : result[i].title,
                            name : result[i].name,
                            writedate : result[i].writedate,
                            photo :result[i].picture==null ? null : boardlink + listdata.gidx + "/board/" + result[i].picture
                        };
                    }
                    res.json({result:"SUCCESS",resultmsg:"SUCCESS ON LISTING",arr:arr});
                }
                else{
                    console.log('no data, data : ',result);
                    res.json({result:"SUCCESS",resultmsg:"NO DATA",arr:arr});
                }
                connection.release();
            });//query
        }
    });//conn pool
};//글 목록

/*
 * 글 쓰기
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, aidx, title, content, picture
 * editor : pineoc
 * */
exports.boardWrite = function(req,res){
    var writeData = req.body;
    var aidx = cry.decB(writeData.aidx);
    var photo_file;
    var photo_name;

    console.log('recv data bord write, data : ',writeData);
    if(req.files && !(typeof req.files.photo===undefined)){
        photo_file = req.files.photo;
        photo_name = photo_file.name;
    }
    if(writeData.gidx==null || writeData.aidx==0 || writeData.title==null || writeData.content==null ){
        console.log('null data');
        res.json({result:"FAIL",resultmsg:"INVALID DATA NULL"});
        return;
    }

    async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on board write find name, err:',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('SELECT name from account where a_idx=?',[parseInt(aidx)],
                        function(err2,result){
                            if(err2){
                                console.log('error on board write find name , err : ',err2);
                                res.json({result:"FAIL", resultmsg:"INVALID DATA"});
                                connection.release();
                                return;
                            }
                            else if(result.length!=0){
                                console.log('Success on board write find name');
                                callback(null,result[0].name);
                            }
                            else{
                                console.log('no name on account',result);
                                res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                                connection.release();
                                return;
                            }
                            connection.release();
                        });//query
                }
            });//conn pool
        },
        function(arg,callback){
            if(req.files && !(typeof req.files.photo===undefined)){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on board write, err:',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }else{
                        connection.query('INSERT INTO board(group_g_idx,title,name,content,picture,writedate) values(?,?,?,?,?,now())',[parseInt(writeData.gidx),writeData.title,arg,writeData.content,photo_name],
                            function(err2,result){
                                if(err2){
                                    console.log('error on board write, err:',err2);
                                    res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                                    connection.release();
                                    return;
                                }
                                else if(result.affectedRows==1){
                                    console.log('Success on board write');
                                    callback(null,{result:"SUCCESS",resultmsg:"WRITE SUCCESS"});
                                }
                                else{
                                    console.log('error on board write, not affected',result);
                                    res.json({result:"FAIL",resultmsg:"NOT WRITE"});
                                    connection.release();
                                    return;
                                }
                                connection.release();
                            });//query
                    }
                });//conn pool
            }
            else{
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on board write, err:',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }else{
                        connection.query('INSERT INTO board(group_g_idx,title,name,content,writedate) values(?,?,?,?,now())',[parseInt(writeData.gidx),writeData.title,arg,writeData.content],
                            function(err2,result){
                                if(err2){
                                    console.log('error on board write, err:',err2);
                                    res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                                    connection.release();
                                    return;
                                }
                                else if(result.affectedRows==1){
                                    console.log('Success on board write');
                                    callback(null,{result:"SUCCESS",resultmsg:"WRITE SUCCESS"});
                                }
                                else{
                                    console.log('error on board write, not affected',result);
                                    res.json({result:"FAIL",resultmsg:"NOT WRITE"});
                                    connection.release();
                                    return;
                                }
                                connection.release();
                            });//query
                    }
                });//conn pool
            }
        },
        function(arg1,callback){
            if(req.files && !(typeof req.files.photo===undefined)){
                var result_upload = filemgr.uploadfunction(writeData.gidx,"board",photo_file);
                if(result_upload.result=="SUCCESS"){
                    console.log('success on file upload');
                    callback(null,{result:"SUCCESS",resultmsg:"WRITE SUCCESS"});
                }
                else{
                    console.log('fail on file upload');
                    res.json({result:"FAIL",resultmsg:"FILE UPLOAD FAIL"});
                    return;
                }
            }
            else{
                console.log('no file`s board write');
                callback(null,{result:"SUCCESS",resultmsg:"WRITE SUCCESS"});
            }
        }
    ],
        function(err,result){
            if(err){
                console.log('error on board write waterfall',err);
                res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                return;
            }
            else{
                console.log('success write final waterfall');
                res.json(result);
            }
    });//waterfall
};//글 등록

/*
 * 글 읽기
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, bidx
 * editor : pineoc
 * */
exports.boardRead = function(req,res){
    var readData = req.body;
    console.log('recv data on board read, data : ',readData);
    async.waterfall([
        function(callback){//board data
            db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on conn pool board read board data w1, err : ',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }
                    else{
                        connection.query('SELECT *,DATE_FORMAT(writedate,"%Y-%m-%d %h:%i:%S") writedate FROM board where b_idx=? and group_g_idx=?',[parseInt(readData.bidx),parseInt(readData.gidx)],function(err2,result){
                            if(err2){
                                console.log('error on query board read comm data w1, err : ',err2);
                                res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                                connection.release();
                                return;
                            }
                            else if (result.length){//data
                                console.log('select success, data : ',result[0]);
                                var res = {
                                    bidx : result[0].b_idx,
                                    name : result[0].name,
                                    title : result[0].title,
                                    content : result[0].content,
                                    picture : boardlink + readData.gidx + "/board/" + result[0].picture
                                };
                                callback(null,res);
                            }
                            else{//no data
                                console.log('no data read board');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                                connection.release();
                                return;
                            }
                            connection.release();
                        });//query
                    }
            });//conn pool
        },
        function(arg,callback){//comment data
            var arr = [];
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on conn pool board read comm data w2, err : ',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }
                else{
                    connection.query('SELECT name_comm, content_comm, DATE_FORMAT(writedate,"%Y-%m-%d %h:%i:%S") writedate from comment where board_b_idx=?',[parseInt(arg.bidx)],function(err2,result){
                        if(err2){
                            console.log('error on query board read comm data w2, err : ',err2);
                            res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                            connection.release();
                            return;
                        }
                        else if(result.length){
                            for(var i=0;i<result.length;i++){
                                arr[i]={
                                    name_comm : result[i].name_comm,
                                    comment : result[i].content_comm,
                                    writedate : result[i].writedate
                                };
                            }
                            callback(null,{content:arg,comment:arr});
                        }
                        else{//no data
                            console.log('no data on comment');
                            callback(null,{content:arg,comment:null});
                        }
                        connection.release();
                    });//query
                }
            });//conn pool
        }
    ],function(err,result){
        if(err){
            console.log('error on waterfall read board err : ',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
            return;
        }
        else{
            console.log('Success on waterfall read board');
            res.json({result:"SUCCESS",resultmsg:"READ SUCCESS",content:result.content,comment:result.comment});
        }
    });//waterfall end
};//글 보기

/*
 * 글 수정
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, aidx, title, content, picture
 * editor : pineoc
 * */
exports.boardUpdate = function(req,res){
    var updateData = req.body;
    console.log('recv data board update, data : ',updateData);

};//글 수정 / 삭제

/*
 * 글 삭제
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, aidx, title, content, picture
 * editor : pineoc
 * */
exports.boardDelete = function(req,res){
    var deleteData = req.body;
    console.log('recv data board delete, data : ',deleteData);

};//글 삭제

/*
 * 덧글 쓰기
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, aidx, content, bidx
 * editor : pineoc
 * */
exports.commWrite = function(req,res){
    var commWData = req.body;
    var aidx = cry.decB(commWData.aidx);
    console.log('recv data comm write, data : ',commWData);
    async.waterfall([
        function(callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on comm write find name, err:',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('SELECT name from account where a_idx=?',[parseInt(aidx)],
                        function(err2,result){
                            if(err2){
                                console.log('error on comm write find name , err : ',err2);
                                res.json({result:"FAIL", resultmsg:"INVALID DATA"});
                                connection.release();
                                return;
                            }
                            else if(result.length){
                                console.log('Success on comm write find name');
                                callback(null,result[0].name);
                            }
                            else{
                                console.log('no name on account',result);
                                res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                                connection.release();
                                return;
                            }
                            connection.release();
                        });//query
                }
            });//conn pool
        },
        function(arg,callback){
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on conn pool comm write, err : ',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    return;
                }else{
                    connection.query('INSERT INTO comment(board_b_idx,name_comm,content_comm,writedate) values(?,?,?,now())',[parseInt(commWData.bidx),arg,commWData.content],function(err2,result){
                        if(err2){
                            console.log('error on query comm write, err : ',err);
                            res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                            connection.release();
                            return;
                        }
                        else if(result.affectedRows==1){
                            console.log('Success comm write w1');
                            callback(null,1);
                        }
                        connection.release();
                    });//query
                }
            });//conn pool
        }
    ],function(err,result){
        if(err){
            console.log('error on write comm waterfall, err : ',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
            return;
        }
        else{
            console.log('Success waterfall write comm');
            res.json({result:"SUCCESS",resultmsg:"WRITE COMM SUCCESS"});
        }
    });//waterfall end
};//덧글 입력

/*
 * 덧글 수정 / 삭제
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx, aidx, title, content, picture
 * editor : pineoc
 * */
exports.commUpdate = function(req,res){

};//덧글 수정 / 삭제

/*
 * 글 찾기
 * 최초 생성 날짜 : 2014.03.04
 * 최종 수정 날짜 : 2014.03.04
 *
 * 받는 데이터 gidx , name, title
 * editor : pineoc
 * */
exports.boardSearch = function(req,res){
    var searchData = req.body;
    console.log('recv data on search board, data : ',searchData);

    db.pool.getConnection(function(err,connection){
        if(err){
            console.log('error on conn pool board search data w1, err : ',err);
            res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
            return;
        }
        else{
            connection.query('SELECT *,DATE_FORMAT(writedate,"%Y-%m-%d %h:%i:%S") writedate FROM board where group_g_idx=? AND( name LIKE ? OR title LIKE ? )',
                [parseInt(searchData.gidx),searchData.name+"%",searchData.title+"%"],function(err2,result){
                if(err2){
                    console.log('error on query board read comm data w1, err : ',err2);
                    res.json({result:"FAIL",resultmsg:"INVALID DATA"});
                    connection.release();
                    return;
                }
                else if (result.length){//data
                    console.log('select success, data : ',result[0]);
                    var ret = [];
                    for(var i=0;i<result.length;i++){
                        ret[i] = {
                            bidx : result[0].b_idx,
                            name : result[0].name,
                            title : result[0].title,
                            content : result[0].content,
                            picture : boardlink + searchData.gidx + "/board/" + result[0].picture
                        };
                    }
                    res.json({result:"SUCCESS", resultmsg : "SEARCH SUCCESS", data : ret});
                }
                else{//no data
                    console.log('no data read board');
                    res.json({result:"FAIL",resultmsg:"NO DATA"});
                    connection.release();
                    return;
                }
                connection.release();
            });//query
        }
    });//conn pool

};//글 찾기
