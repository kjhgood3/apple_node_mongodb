const express = require('express');
const app = express();

// body-parser
const bodyParser = require('body-parser');   //input을 통해 req에 저장된거 쓰려면 필요함
app.use(bodyParser.urlencoded({ extended: true }));   //input을 통해 req에 저장된거 쓰려면 필요함

// MongoDB로 연결
const MongoClient = require('mongodb').MongoClient;

// ejs 적용
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://admin:0000@cluster0.suxhf.mongodb.net/todoapp?retryWrites=true&w=majority', (error, client) => {
    // 연결되면 할일
    if (error) return console.log(error);  // 만약 error가 났다면 console.log에 error를 띄워주세요.
    // todoapp 이라는 데이터베이스에 접근하기
    db = client.db('todoapp');

    // 서버 열기
    app.listen(8088, () => {
        console.log('8088포트로 접속 완료');
    });
});



//===========홈
app.get('/', (req, res) => {
    console.log('/로 접속 성공');
    res.sendFile(__dirname + '/index.html');
});
//===========write
app.get('/write', (req, res) => {
    console.log('/write로 접속 성공');
    res.sendFile(__dirname + '/write.html');
});
//===========add
app.post('/add', (req, res) => {
    console.log('/add로 접속 성공');
    res.send('폼 전송 완료!');
    // console.log(req.body.title);   // 입력폼에 적힌 값이 req에 저장된다. body-parser사용하면 body로 불러올 수 있다..

    // findOne() : 데이터 1개 찾기
    // 게시물 번호를 붙이는 기능 만들기
    // 1. 자동증가 기능이 없어서 총게시글갯수를 볼 수 있는 'counter' collection을 만든다 // {name:'total'}는 db 쿼리와 같음  // 총게시글번호 가져오려고만 사용함
    db.collection('counter').findOne({ name: 'total' }, (error, result) => {
        console.log(result.totalPost); // 초기값 0으로 설정됨
        // 2. 진짜 게시글 리스트에 번호를 넣기 위해.. 진짜로 사용하는 'post' collection에 사용할 변수로 만들어준다.
        var totalPostCount = result.totalPost;
        // insertOne() : 데이터 1개 저장하기
        // 3. 해당변수에 + 1해서 1씩 증가하는 값을 만들어 준다.
        db.collection('post').insertOne({ _id: totalPostCount + 1, title: req.body.title, date: req.body.date }, (error, result) => { // 총게시물갯수를 따로 관리하자!
            console.log('저장 완료!');
            // updateOne() : 데이터 1개 수정하기 ,  updateMany() : 데이터 여러개 수정하기
            // updateOne()은 {}로 한번더 감싸고, 아예 변경하려면 $set, 기존 값에서 증가시키려면 $inc 사용하기
            // 4. insertOne()으로 게시글이 추가 되었으니 counter의 totalPost도 1개 증가시켜줘야 한다. (수정하기)
            db.collection('counter').updateOne({ name: 'total' }, { $inc: { totalPost: 1 } }, (error, result) => {
                if (error) return console.log(error);
            });
        });


    });
});
//===========list
app.get('/list', (req, res) => {
    console.log('/list로 접속 성공');
    // find()만 하면 모든메타데이터도 가져옴.. toArray붙여서 일반적인 모든 데이터 가져오기
    db.collection('post').find().toArray((error, result) => {
        // console.log(result);
        res.render('./list.ejs', { posts: result }); // ejs파일은 view폴더안에 들어가야하고 render로 불러와야 한다. ','를 붙여서 변수처럼 지정해준다.
    });
});
//===========delete
app.delete('/delete', (req, res) => {
    // ajax에서 data에 담긴 값이 req에 저장되어서 오기 때문에 req.body로 꺼내볼수 있다
    console.log(req.body);
    // ajax로 데이터가 전송될때 숫자가 문자로 변해서 오기 때문에 parseInt()로 형변환해줘야한다.
    req.body._id = parseInt(req.body._id);
    console.log(req.body);
    db.collection('post').deleteOne(req.body, (error, result) => {
        console.log('삭제완료');
        res.status(200).send({ message: '성공했습니다' });  // 응답코드 200은 성공했다는 뜻. 성공했다는걸 브라우저에 알려줘야 ajax에서 성공했을 때의 코드를 실행하기 때문이다. // 400은 실패했다는 뜻..
    });
});