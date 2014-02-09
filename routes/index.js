/*
 by pineoc
 pineoc@naver.com
 content : login & ranking
 2014.02.03 - start
 * */


var async = require('async');

var db = require('./localDB.js');
//var db = require('./clouluDB.js');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function(req,res){

};

/*
 * 랭킹 데이터
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.06
 *
 * 받는 데이터 allscore, allgame, type, limit
 * editor : pineoc
 * */
exports.ranking = function(req,res){
    var rankData = req.body;
    var limit = 0;

    //limit = req.params.limit;
    if(rankData.type=="world"){//개인 데이터에 따른 월드 랭킹

        async.waterfall([//랭킹 데이터를 json 형태로 만들기 위해서
            function (callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool world rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT name,country,prophoto,ballphoto,allscore,allgame,all_highscore,highscore,profile_detail FROM account order by (allscore/allgame) desc limit ?,30',[limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query world rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                callback(null,results);//data
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                //console.log('arg1 : ',arg1,arg1.allscore,arg1.allgame);
                var arr=[];
                var avg = rankData.allscore/rankData.allgame;
                var resultData;
                var worldRank=0;

                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool world rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a where (a.allscore/a.allgame)>=? order by (a.allscore/a.allgame) desc',
                            [avg],//평균 값, 해당 아이디 idx
                            function(err2,results){
                                if(err2){
                                    console.log('error on query world rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                else{
                                    worldRank = results[0].cnt+1;
                                    console.log(worldRank,avg,results);
                                    for(var i=0;i<arg1.length;i++){
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1[i].name,
                                            country : arg1[i].country,
                                            proPhoto : arg1[i].prophoto,
                                            ballPhoto : arg1[i].ballphoto,
                                            avg : parseInt(arg1[i].allscore/arg1[i].allgame),
                                            allhighScore : arg1[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1[i].highscore,//그주의 최고점수
                                            profileDetail : arg1[i].profile_detail // 구질, 구력, 스텝, 800시리즈 string
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {rank:worldRank,arr:arr};
                                    callback(null,resultData);
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            }
        ],
            function(err,results){
                if(err){
                    console.log('error on sort async waterfall world',err);
                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                }
                else{
                    console.log('data : ',results);
                    res.json(results);
                }
            }
        );

    }
    else if(rankData.type=="local"){//점수를 입력한 데이터
        async.waterfall([//랭킹 데이터를 json 형태로 만들기 위해서
            function (callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool local rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT * FROM account where locale=? order by (allscore/allgame) desc limit ?,30',
                            [rankData.locale,limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query local rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                callback(null,results);//data
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                console.log('arg1 : ',arg1);
                var arr=[];
                var avg = rankData.allscore/rankData.allgame;
                var resultData;
                var localRank=0;
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool local rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a where (a.allscore/a.allgame)>=? and a.locale=? order by (a.allscore/a.allgame) desc',
                            [avg,rankData.locale],//평균 값, 해당 아이디 idx
                            function(err2,results){
                                if(err2){
                                    console.log('error on query local rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                else{
                                    localRank = results[0].cnt+1;
                                    for(var i=0;i<arg1.length;i++){
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1[i].name,
                                            country : arg1[i].country,
                                            proPhoto : arg1[i].prophoto,
                                            ballPhoto : arg1[i].ballphoto,
                                            avg : parseInt(arg1[i].allscore/arg1[i].allgame),
                                            allhighScore : arg1[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1[i].highscore,//그주의 최고점수
                                            profileDetail : arg1[i].profile_detail // 구질, 구력, 스텝, 800시리즈 string
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {rank:localRank,arr:arr};
                                    callback(null,resultData);
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool

            }
        ],
            function(err,results){
                if(err){
                    console.log('error on sort async waterfall local',err);
                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                }
                else{
                    console.log('data : ',results);
                    res.json(results);
                }
            }
        );
    }//local data ranking
    else if(rankData.type!=0){//그룹에 대한 랭킹
        var groupidx = rankData.type;
        var groupRank=0;
        async.waterfall([//랭킹 데이터를 json 형태로 만들기 위해서
            function (callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool group rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT * FROM account a, account_has_group ag where ag.group_g_idx=? order by (ag.g_score/ag.g_game) desc limit ?,30',
                            [groupidx,limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query group rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                callback(null,results);//data
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                console.log('arg1 : ',arg1);
                var arr=[];
                var avg = rankData.allscore/rankData.allgame;
                var resultData;
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool group rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a,account_has_group ag where (ag.g_score/ag.g_game)>=? and ag.group_g_idx=? order by (ag.g_score/ag.g_game) desc',
                            [avg,groupidx],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query group rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                }
                                else{
                                    groupRank = results[0].cnt;
                                    for(var i = 0; i < arg1.length; i++){
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1[i].name,
                                            country : arg1[i].country,
                                            proPhoto : arg1[i].prophoto,
                                            ballPhoto : arg1[i].ballphoto,
                                            avg : parseInt(arg1[i].allscore/arg1[i].allgame),
                                            allhighScore : arg1[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1[i].highscore,//그주의 최고점수
                                            profileDetail : arg1[i].profile_detail // 구질, 구력, 스텝, 800시리즈 string
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {rank:groupRank,arr:arr};
                                    callback(null,arr);
                                }

                                connection.release();
                            });//query
                    }
                });//connection pool

            }
        ],
            function(err,results){
                if(err){
                    console.log('error on sort async waterfall group',err);
                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                }
                else{
                    console.log('data : ',results);
                    res.json(results);
                }
            }
        );
    }//group data ranking
};//랭킹 출력