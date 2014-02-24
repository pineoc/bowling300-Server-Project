/*
 by pineoc
 pineoc@naver.com
 content : login & ranking
 2014.02.03 - start
 * */

var async = require('async');

//var db = require('./localDB.js');
var db = require('./clouluDB.js');
var cry = require('./crypto_pineoc.js');
var date = new Date();


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
    console.log('recv data login : ',loginData);
    async.waterfall([
        function(callback){
            var ret;
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on conn pool login',err);
                    res.json({myval:{result:"FAIL",resultmsg:"NETWORK ERR"}});
                    return ;
                }
                else{
                    connection.query('SELECT *,count(*) cnt FROM account WHERE email=? AND pwd=?',[loginData.email,loginData.pwd],function(err2,result){
                        if(err2){
                            console.log('error on query login',err2);
                            res.json({myval:{result:"FAIL",resultmsg:"NETWORK ERR Q"}});
                            connection.release();
                            return;
                        }
                        else{
                            if(result[0].cnt==0){
                                console.log('no account on DB',result[0].cnt);
                                res.json({myval:{result:"FAIL",resultmsg:"NO ACCOUNT"}});
                            }
                            else{
                                console.log('Success on login, mydata : ',result);
                                ret = {
                                    result:"SUCCESS",resultmsg:"SUCCESS ON LOGIN",
                                    aidx:cry.encB(result[0].a_idx),
                                    name:result[0].name,
                                    sex:result[0].sex,
                                    country:result[0].country,
                                    email:result[0].email,
                                    hand:result[0].hand,
                                    proPhoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+result[0].a_idx+"/"+result[0].prophoto
                                };
                                callback(null,ret);
                            }
                        }
                        connection.release();
                    });//query
                }
            });//conn pool
        },
        function(arg,callback){
            var arr = [];
            db.pool.getConnection(function(err,connection){
                if(err){
                    console.log('error on connection pool grp list',err);
                    res.json({myval:{result:"FAIL",resultmsg:"NETWORK ERR"}});
                    return;
                }//error on conn pool
                else{
                    connection.query('select g.g_name gname, g.g_photo gphoto,g.g_idx gidx,DATE_FORMAT(g.g_date,"%Y-%m-%d") gdate,ag.g_joindate joindate from groups as g left outer join account_has_group as ag on g.g_idx = ag.group_g_idx where ag.group_g_idx is not null and ag.account_a_idx=? order by DATE(joindate),HOUR(joindate), MINUTE(joindate), joindate ',
                        [cry.decB(arg.aidx)],function(err2,results){
                            if(err2){
                                console.log('error on query grp list',err2);
                                res.json({myval:{result:"FAIL",resultmsg:"NETWORK ERR Q"}});
                                connection.release();
                                return;
                            }
                            else if(results){
                                console.log('success list grp on login');
                                for(var i=0;i<results.length;i++){
                                    arr[i] = {
                                        gidx :results[i].gidx,
                                        gname:results[i].gname
                                    };
                                }//for
                                //res.json({result:"SUCCESS",group:arr});
                                callback(null,{myval:arg,group:arr});
                            }
                            else{
                                console.log('no group');
                                callback(null,{myval:arg});
                            }
                            connection.release();
                        });//query
                }
            });//connection pool
        }
    ],function(err,result){
        if(err){
            console.log('error on waterfall ',err);
            res.json({myval:{result:"FAIL",resultmsg:"NETWORK ERR W"}});
            return;
        }
        else{
            console.log('Success on login',result);
            res.json(result);
        }
    });
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
    var aidx;
    if(rankData.aidx!=0){
        aidx = cry.decB(rankData.aidx);
    }
    else{
        aidx=0;
    }
    var limit = 0;
    console.log('recv data ranking : ',rankData);
    //limit = req.params.limit;
    if(rankData.type=="world" && aidx!=0){//개인 데이터에 따른 월드 랭킹
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
                        connection.query('SELECT allscore,allgame,prophoto from account where a_idx=?',[aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                connection.release();
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
                                callback(null,{avg:avg,prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+aidx+"/"+result[0].prophoto});
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
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else{
                                    console.log('avg : ',arg.avg);
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
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else{
                                    worldRank = results2[0].cnt;
                                    console.log(worldRank,avg);
                                    //console.log(worldRank,avg,results);
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/country/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            infocountry : "http://bowling.pineoc.cloulu.com/uploads/country/info"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : parseFloat(arg1.results[i].allscore/arg1.results[i].allgame).toFixed(1),
                                            allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1.results[i].highscore,//그주의 최고점수
                                            handi : arg1.results[i].handi,
                                            hand : arg1.results[i].hand,
                                            year : date.getFullYear()-arg1.results[i].year+1,
                                            ballweight : arg1.results[i].ballweight,
                                            style : arg1.results[i].style,
                                            step : arg1.results[i].step,
                                            series300 : arg1.results[i].series300,
                                            series800 : arg1.results[i].series800
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {myavg:parseFloat(avg).toFixed(1),myrank:worldRank,myproPhoto:arg1.prophoto,arr:arr};
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
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                }
                else{
                    console.log('success on world ranking data');
                    res.json(results);
                }
            }
        );

    }
    else if(rankData.type=="world" && aidx==0){
        async.waterfall([//랭킹 데이터를 json 형태로 만들기 위해서
            function (callback){
                db.pool.getConnection(function(err,connection){
                    if(err){
                        console.log('error on connection pool world rank aidx=0',err);
                        res.json({result:"FAIL",resultmsg:"NETWORK ERR"});
                        return;
                    }//error on connection pool
                    else{
                        connection.query('SELECT * FROM account order by (allscore/allgame) desc limit ?,30',[limit],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query world rank aidx=0',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else{
                                    callback(null,{results:results});//data
                                }
                                connection.release();
                            });//query
                    }
                });//connection pool
            },
            function (arg1,callback){
                //console.log('arg1 : ',arg1,arg1.allscore,arg1.allgame);
                var arr=[];
                var resultData;
                for(var i=0;i<arg1.results.length;i++){
                    var link;
                    if(arg1.results[i].prophoto==null){
                        link = "http://bowling.pineoc.cloulu.com/uploads/country/KakaoTalk_b6634420cfc0d1b1.png";
                    }
                    else{
                        link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                    }
                    arr[i]={
                        rank : i+1,
                        name : arg1.results[i].name,
                        country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                        infocountry : "http://bowling.pineoc.cloulu.com/uploads/country/info"+arg1.results[i].country+".png",
                        proPhoto : link,
                        ballPhoto : arg1.results[i].ballphoto,
                        avg : parseFloat(arg1.results[i].allscore/arg1.results[i].allgame).toFixed(1),
                        allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                        highscore : arg1.results[i].highscore,//그주의 최고점수
                        handi : arg1.results[i].handi,
                        hand : arg1.results[i].hand,
                        year : date.getFullYear()-arg1.results[i].year+1,
                        ballweight : arg1.results[i].ballweight,
                        style : arg1.results[i].style,
                        step : arg1.results[i].step,
                        series300 : arg1.results[i].series300,
                        series800 : arg1.results[i].series800
                    };//arr에 정보를 객체 형태로 저장
                }//for
                resultData = {arr:arr};
                callback(null,resultData);
            }

        ],
            function(err,results){
                if(err){
                    console.log('error on sort async waterfall world',err);
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                }
                else{
                    console.log('success on ranking aidx=0');
                    res.json(results);
                }
            }
        );
    }
    else if(rankData.type=="local" && aidx!=0){//점수를 입력한 데이터
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
                        connection.query('SELECT allscore,allgame,prophoto,country from account where a_idx=?',[aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                connection.release();
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
                                    prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+aidx+"/"+result[0].prophoto});
                            }
                            else{
                                console.log('no data local rank my data');
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
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else if(results.length){
                                    console.log('avg : ',arg.avg);
                                    //console.log(result);
                                    callback(null,{results:results,avg:arg.avg,prophoto:arg.prophoto,country:arg.country});
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
                        connection.query('SELECT count(*) cnt FROM account a where (a.allscore/a.allgame)>=? and a.country=? order by (a.allscore/a.allgame) desc',
                            [avg,arg1.country],//평균 값, 해당 아이디 idx
                            function(err2,results2){
                                if(err2){
                                    console.log('error on query local rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else{
                                    localRank = results2[0].cnt;
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/country/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            infocountry : "http://bowling.pineoc.cloulu.com/uploads/country/info"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : parseFloat(arg1.results[i].allscore/arg1.results[i].allgame).toFixed(1),
                                            allhighScore : arg1.results[i].all_highscore,//지금까지의 최고점수
                                            highscore : arg1.results[i].highscore,//그주의 최고점수
                                            handi : arg1.results[i].handi,
                                            hand : arg1.results[i].hand,
                                            year : date.getFullYear()-arg1.results[i].year+1,
                                            ballweight : arg1.results[i].ballweight,
                                            style : arg1.results[i].style,
                                            step : arg1.results[i].step,
                                            series300 : arg1.results[i].series300,
                                            series800 : arg1.results[i].series800
                                        };//arr에 정보를 객체 형태로 저장
                                    }//for
                                    resultData = {myavg:parseFloat(avg).toFixed(1),myrank:localRank,myproPhoto:arg1.prophoto,arr:arr};
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
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                }
                else{
                    console.log('success on ranking local');
                    res.json(results);
                }
            }
        );
    }//local data ranking
    else if(rankData.type>0 && aidx!=0){//그룹에 대한 랭킹
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
                        connection.query('select * from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=? and a.a_idx=?',
                            [groupidx,aidx],function(err2,result){
                            if(err2){
                                console.log('error on get allscore allgame in ranking query',err2);
                                res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                connection.release();
                                return;
                            }
                            else if(result.length){
                                if(result[0].g_game!=0){
                                    avg = result[0].g_score/result[0].g_game;
                                }
                                else{
                                    avg=0;
                                }
                                console.log('avg : ',avg);
                                //console.log(result);
                                callback(null,{avg:avg,prophoto:"http://bowling.pineoc.cloulu.com/uploads/user/"+aidx+"/"+result[0].prophoto});
                            }
                            else{
                                console.log('no data on grp account data me ');
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
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else if(results.length){
                                    callback(null,{results:results,avg:arg.avg,prophoto:arg.prophoto});//data
                                }
                                else{
                                    console.log('no data on grp rank');
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
                        connection.query('select count(*) cnt from account as a left outer join account_has_group as ag on a.a_idx = ag.account_a_idx where ag.group_g_idx is not null and ag.group_g_idx=? and (ag.g_score/ag.g_game)>=? order by (ag.g_score/ag.g_game) desc',
                            [groupidx,avg],
                            function(err2,results){
                                if(err2){
                                    console.log('error on query group rank me',err2);
                                    res.json({result:"FAIL",resultmsg:"NETWORK ERR Q"});
                                    connection.release();
                                    return;
                                }
                                else if(results.length){
                                    groupRank = results[0].cnt;
                                    for(var i=0;i<arg1.results.length;i++){
                                        var link;
                                        if(arg1.results[i].prophoto==null){
                                            link = "http://bowling.pineoc.cloulu.com/uploads/country/KakaoTalk_b6634420cfc0d1b1.png";
                                        }
                                        else{
                                            link = "http://bowling.pineoc.cloulu.com/uploads/user/"+arg1.results[i].a_idx+"/"+arg1.results[i].prophoto;
                                        }
                                        arr[i]={
                                            rank : i+1,
                                            name : arg1.results[i].name,
                                            country : "http://bowling.pineoc.cloulu.com/uploads/country/"+arg1.results[i].country+".png",
                                            infocountry : "http://bowling.pineoc.cloulu.com/uploads/country/info"+arg1.results[i].country+".png",
                                            proPhoto : link,
                                            ballPhoto : arg1.results[i].ballphoto,
                                            avg : parseFloat(arg1.results[i].g_score/arg1.results[i].g_game).toFixed(1),
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
                                    resultData = {myavg:parseFloat(avg).toFixed(1),myrank:groupRank,myproPhoto:arg1.prophoto,arr:arr};
                                    callback(null,resultData);
                                }
                                else{
                                    console.log('no data on grp ranking');
                                    res.json({result:"FAIL",resultmsg:"NO DATA"});
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
                    res.json({result:"FAIL",resultmsg:"NETWORK ERR W"});
                }
                else{
                    console.log('success on ranking grp');
                    res.json(results);
                }
            }
        );
    }//group data ranking
    else{
        console.log('error on aidx=0 not world');
        res.json({result:"FAIL",resultmsg:"AIDX ZERO"});
        return;
    }
};//랭킹 출력