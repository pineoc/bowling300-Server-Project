/*
 by pineoc
 pineoc@naver.com
 content : login & ranking
 2014.02.03 - start
 * */

var async = require('async');

//var db = require('./localDB.js');
var db = require('./clouluDB.js');


exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

/*
 * 로그인
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.17
 *
 * 받는 데이터 email, pwd
 * editor : pineoc
 * */
exports.login = function(req,res){
    var loginData = req.body;


};

/*
 * 랭킹 데이터
 * 최초 생성 날짜 : 2014.02.02
 * 최종 수정 날짜 : 2014.02.18
 *
 * 받는 데이터 allscore, allgame, type, limit
 * editor : pineoc
 * */
exports.ranking = function(req,res){
    var rankData = req.body;
    var limit = 0;
    console.log('recv data ranking : ',rankData);
    //limit = req.params.limit;
    if(rankData.type=="world"){//개인 데이터에 따른 월드 랭킹
        async.waterfall([//랭킹 데이터를 json 형태로 만들기 위해서
            function(callback){
                var avg;
                //get allscore and allgame
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on get allscore allgame in ranking conn pool',err);
                        res.json({result:"FAIL",resultmsg:"NETOWRK ERR"});
                        return;
                    }
                    else{
                        connection.query('SELECT allscore,allgame,prophoto from account where a_idx=?',[rankData.aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"INVALID QUERY"});
                                return;
                            }
                            else if(result.length){
                                if(result[0].allgame!=0){
                                    avg = result[0].allscore/result[0].allgame;
                                }
                                else{
                                    avg=0;
                                }
                                console.log('avg : ',avg);
                                //console.log(result);
                                callback(null,{avg:avg,prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+rankData.aidx+"/"+result[0].prophoto});
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                            }
                            connection.release();
                        });//query
                    }
                });//connection pool
            },
            function (arg,callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool world rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT * FROM account order by (allscore/allgame) desc limit ?,30',[limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query world rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else{
                                    console.log('avg on query : ',arg);
                                    callback(null,{results:results,avg:arg.avg,prophoto:arg.prophoto});//data
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                //console.log('arg1 : ',arg1,arg1.allscore,arg1.allgame);
                var arr=[];
                var avg = arg1.avg;
                var resultData;
                var worldRank=0;

                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool world rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a where (a.allscore/a.allgame)>=? order by (a.allscore/a.allgame) desc',
                            [avg],//평균 값, 해당 아이디 idx
                            function(err2,results2){
                                if(err2){
                                    console.log('error on query world rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else{
                                    worldRank = results2[0].cnt+1;
                                    console.log(worldRank,avg);
                                    //console.log(worldRank,avg,results);
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : (arg1.results[i].allscore/arg1.results[i].allgame).toFixed(1),
                                            allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1.results[i].highscore,//그주의 최고점수
                                            handi : arg1.results[i].handi,
                                            hand : arg1.results[i].hand,
                                            year : arg1.results[i].year,
                                            ballweight : arg1.results[i].ballweight,
                                            style : arg1.results[i].style,
                                            step : arg1.results[i].step,
                                            series300 : arg1.results[i].series300,
                                            series800 : arg1.results[i].series800
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {myavg:avg,myrank:worldRank,myproPhoto:arg1.prophoto,arr:arr};
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
            function(callback){
                var avg;
                //get allscore and allgame
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on get allscore allgame in ranking conn pool',err);
                        res.json({result:"FAIL",resultmsg:"NETOWRK ERR"});
                        return;
                    }
                    else{
                        connection.query('SELECT allscore,allgame,prophoto,country from account where a_idx=?',[rankData.aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"INVALID QUERY"});
                                return;
                            }
                            else if(result.length){
                                if(result[0].allgame!=0){
                                    avg = result[0].allscore/result[0].allgame;
                                }
                                else{
                                    avg=0;
                                }
                                console.log('avg : ',avg);
                                callback(null,{avg:avg,country:result[0].country,
                                    prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+rankData.aidx+"/"+result[0].prophoto});
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                            }
                            connection.release();
                        });//query
                    }
                });//connection pool
            },
            function (arg,callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool local rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT * FROM account where country=? order by (allscore/allgame) desc limit ?,30',
                            [arg.country,limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query local rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else if(results.length){
                                    console.log('avg : ',results[0].allscore/results[0].allgame);
                                    //console.log(result);
                                    callback(null,{results:results,avg:arg.avg,prophoto:arg.prophoto});
                                }
                                else{
                                    console.log('no data');
                                    res.json({result:"FAIL",resultmsg:"NO DATA"});
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                console.log('arg1 : ',arg1);
                var arr=[];
                var avg = arg1.avg;
                var resultData;
                var localRank=0;
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool local rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a where (a.allscore/a.allgame)>=? and a.locale=? order by (a.allscore/a.allgame) desc',
                            [avg,rankData.locale],//평균 값, 해당 아이디 idx
                            function(err2,results2){
                                if(err2){
                                    console.log('error on query local rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else{
                                    localRank = results2[0].cnt+1;
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : (arg1.results[i].allscore/arg1.results[i].allgame).toFixed(1),
                                            allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1.results[i].highscore,//그주의 최고점수
                                            handi : arg1.results[i].handi,
                                            hand : arg1.results[i].hand,
                                            year : arg1.results[i].year,
                                            ballweight : arg1.results[i].ballweight,
                                            style : arg1.results[i].style,
                                            step : arg1.results[i].step,
                                            series300 : arg1.results[i].series300,
                                            series800 : arg1.results[i].series800
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {myavg:avg,myrank:localRank,myproPhoto:arg1.prophoto,arr:arr};
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
            function(callback){
                var avg;
                //get allscore and allgame
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on get allscore allgame in ranking conn pool',err);
                        res.json({result:"FAIL",resultmsg:"NETOWRK ERR"});
                        return;
                    }
                    else{
                        connection.query('SELECT allscore,allgame,prophoto from account where a_idx=?',[rankData.aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"INVALID QUERY"});
                                return;
                            }
                            else if(result.length){
                                if(result[0].allgame!=0){
                                    avg = result[0].allscore/result[0].allgame;
                                }
                                else{
                                    avg=0;
                                }
                                console.log('avg : ',result[0].allscore/result[0].allgame);
                                //console.log(result);
                                callback(null,{avg:avg,prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+rankData.aidx+"/"+result[0].prophoto});
                            }
                            else{
                                console.log('no data');
                                res.json({result:"FAIL",resultmsg:"NO DATA"});
                            }
                            connection.release();
                        });//query
                    }
                });//connection pool
            },
            function (arg,callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool group rank',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('select * from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=? order by (ag.g_score/ag.g_game) desc limit ?,30',
                            [groupidx,limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query group rank',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else if(results.length){
                                    callback(null,{results:results,avg:arg.avg,prophoto:arg.prophoto});//data
                                }
                                else{
                                    console.log('no data');
                                    res.json({result:"FAIL",resultmsg:"NO DATA"});
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                console.log('arg1 : ',arg1);
                var arr=[];
                var avg = arg1.avg;
                var resultData;
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool group rank me',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT count(*) cnt FROM account a,account_has_group ag where (ag.g_score/ag.g_game)>=? and ag.group_g_idx=? order by (ag.g_score/ag.g_game) desc',
                            [avg,groupidx],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query group rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"SORTING ERR"});
                                    return;
                                }
                                else if(results.length){
                                    groupRank = results[0].cnt+1;
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/test/1479/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : (arg1.results[i].g_score/arg1.results[i].g_game).toFixed(1),
                                            allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1.results[i].highscore,//그주의 최고점수
                                            handi : arg1.results[i].handi,
                                            hand : arg1.results[i].hand,
                                            year : arg1.results[i].year,
                                            ballweight : arg1.results[i].ballweight,
                                            style : arg1.results[i].style,
                                            step : arg1.results[i].step,
                                            series300 : arg1.results[i].series300,
                                            series800 : arg1.results[i].series800
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {myavg:avg,myrank:groupRank,myproPhoto:arg1.prophoto,arr:arr};
                                    callback(null,resultData);
                                }
                                else{
                                    console.log('no data',results);
                                    res.json({result:"SUCCESS",resultmsg:"NO DATA"});
                                    return;
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