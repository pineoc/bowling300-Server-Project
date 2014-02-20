
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var grp = require('./routes/grp');
var board = require('./routes/board');
var test = require('./routes/test');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

//upload enable
app.use(express.multipart());

app.use(app.router);

app.use('/uploads', express.directory(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

//ranking function ( 랭킹 출력 함수 )
app.post('/ranking',routes.ranking);

//login & sign (로그인 및 회원 가입)
app.post('/login',routes.login);
app.post('/user/sign',user.sign);
app.post('/user/addsign',user.addsign);
app.post('/user/userinfo',user.userinfo);
app.get('/user/rankpoint',user.rankpoint);

//insert data function( 점수 입력 함수 )
app.post('/user/score',user.insertScore);
//test
app.post('/test/upload',test.upload);

//group function ( 그룹 관련 함수)
app.post('/user/groupmake',grp.groupMake);
app.post('/user/groupjoin',grp.groupJoin);
app.post('/user/grouplist',grp.groupList);
app.post('/user/groupdel',grp.groupDelete);
app.post('/user/groupsearch',grp.groupsearch);
app.post('/user/groupmember',grp.groupmember);
app.post('/user/groupleague',grp.groupLeague);
//test
app.post('/test/cry',test.testenc);

//board function ( 게시판 관련 함수 )
app.get('/user/group/board/:groupidx',board.boardList);//그룹 글 목록
app.post('/user/group/board/:groupidx/write',board.boardWrite);//글 등록
app.post('/user/group/board/:groupidx/:conidx/update',board.boardUpdate);//글 수정 / 삭제
app.post('/user/group/board/:groupidx/:conidx',board.boardRead);//글보기
app.post('/user/group/board/:groupidx/:conidx/comwrite',board.commWrite);//덧글 입력
app.post('/user/group/board/:groupidx/:conidx/comupdate',board.commUpdate);//덧글 수정 / 삭제

//사진 업로드 -> 공 사진 및 프로필 사진
app.post('/user/deletephoto',user.deletePhoto);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
