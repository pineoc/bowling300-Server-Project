/*
 by pineoc
 pineoc@naver.com
 content : testing
 2014.02.03 - start
 * */

var db = require('./localDB');
//var db = require('./clouluDB');

var path = require('path');
var fs = require('fs');
var easyimage = require('easyimage');
var uploadFunc = function(data){

};
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
        var userfolder = path.resolve(process.env.UPLOAD_PATH,a_idx);
        console.log('userfolder : ',userfolder);
        if(!fs.existsSync(userfolder)){
            fs.mkdirSync(userfolder);
        }

        var name = uploadData.name;//upload file name ex>file.jpg
        var srcpath = uploadData.path;//현재 폴더 위치 -> 업로드 하는 기기
        var destpath = path.resolve(__dirname,'..',userfolder,name);//public/1/이미지.jpg
        var checkext = path.extname(name);

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
                var destimg = filename + '-thumnail'+ext;
                //c:~\public\lee\koala + '-thumnail'+.jpg
                easyimage.thumbnail(
                    {
                        src:srcimg,
                        dst:destimg,
                        width:100,
                        height:100,
                        x:0,
                        y:0
                    },
                    function(err){
                        if(err){
                            console.log(err);
                            res.json(err);
                        }
                        else{
                            console.log('path : ',srcimg,'/ thumnail : ',destimg);
                            res.json("success");
                        }
                    }
                );
            });//is.on callback function
            console.log('result');
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