const express=require('express');
const bodyParser=require('body-parser');
const cookieParser = require('cookie-parser');
const LocalStrategy=require('passport-local').Strategy;
const flash = require("connect-flash");
const passport=require('passport');
const session=require('express-session');
const cors=require('cors');
const path=require('path');
const Pusher = require('pusher');
const randomstring = require("randomstring");
const nodemailer=require('nodemailer');
require('dotenv').config();

const pool=require('./db');
const { stat } = require('fs');

const PORT=process.env.PORT || 5000;

const app=express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(cookieParser('secret'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(cors());
app.use(express.static(path.join(__dirname,'client/build')));

app.set('view engine','ejs');


async function send(receiver,name,token){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: process.env.EMAIL,
               pass: process.env.PASS
        }
    });
    name=name.split(' ');
    s=''
    for(let i=0;i<name.length;i++){
        s=s+name[i].toString()+'%20';
    }
    s=s.slice(0,-3);
    const link='https://dry-ocean-42861.herokuapp.com/verify/'+s+'/'+token;

    const html=`
        <p>Hi ${name}. This is your account validation link <b>${link}.</b> Kindly do not share this link with anyone.</p>
    `;

    const mailOptions = {
        from: process.env.EMAIL, // sender address
        to: receiver, // list of receivers
        subject: 'Notification', // Subject line
        html: html
    };

    await transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else{
            console.log('Mail function called for '+name +".");
        }
    });
}



const admin={
    client_id:1,
    name:'Admin',
    password:'1234'
}

function initialize(passport){
    passport.use(new LocalStrategy({ usernameField:'username',passwordField:'password' },function authenticateUser(username,password,done){

        let query = pool.query(
            "SELECT * FROM client WHERE name=$1 AND valid=$2",
            [username,'Yes'],(err,result) => {
                //result.rows
                if(err) throw err;
                if (result.rows.length===0 && username!==admin.name){
                    return done(null,false,{ message:'Enter valid username' })
                }
                else if(username===admin.name){
                    if(password===admin.password){
                        return done(null,admin,{ message:'Successfully logged in' })
                        //return done(null,result[0])
                    }
                    else{
                        return done(null,false,{ message:'Password incorrect' })
                    }
                }
                else{
                    try{
                        if(password===result.rows[0].password){
                            return done(null,result.rows[0],{ message:'Successfully logged in' })
                            //return done(null,result[0])
                        }
                        else{
                            return done(null,false,{ message:'Password incorrect' })
                        }
                    }
                    catch(e){
                        return done(e)
                    }
                }
            }
        );


    }))

    passport.serializeUser((user,done) => done(null,user.client_id))
    passport.deserializeUser((id,done) => {
        if(Number(id)===1){
            return done(null,admin)
        }
        else{
            let query = pool.query(
                "SELECT * FROM client WHERE client_id=$1",
                [id],(err,result) => {
                    if(err) throw err;
                    return done(null,result.rows[0]);
                }
            );
        }
    })
}


initialize(passport);

function CheckLog(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    else{
        console.log('Get authenticated first')
        res.redirect('/login');
    }
}

function Admin(req,res,next){
    if(req.isAuthenticated()){
        if(req.user.client_id==1){
            return next()
        }
        else{
            res.redirect('/')
        }
    }
    else{
        res.redirect('/login')
    }
}

function NotCheckLog(req,res,next){
    if(req.isAuthenticated()){
        res.redirect('/');
    }
    else{
        return next()
    }
}


function parseDate(str) {
    var mdy = str.split('-');
    return new Date(mdy[2], mdy[0]-1, mdy[1]);
}

function datediff(first, second) {
    // Take the difference between the dates and divide by milliseconds per day.
    // Round to nearest whole number to deal with DST.
    return Math.round((second-first)/(1000*60*60*24));
}




//GENERAL ROUTES.....

app.post('/verify/:token/:name',NotCheckLog,(req,res) => {
    const name=req.params.name.toString();
    const token=req.params.token.toString();
    const password=req.body.password.toString();
    console.log(password);
    pool.query(
        "SELECT * FROM client WHERE name=$1 AND token=$2 AND valid=$3",
        [name,token,'Not'],(err,result) => {
            if(err) throw err;
            if(result.rows.length===0){
                res.redirect('/')
            }
            else{
                const id=Number(result.rows[0].client_id)
                pool.query(
                    "UPDATE client SET password=$1,valid=$2 WHERE client_id=$3",
                    [password,'Yes',id],(err,result) => {
                        if(err) throw err;
                        res.redirect('/');
                    }
                );
            }
        }
    );
})

app.get('/verify/:name/:token',NotCheckLog,(req,res) => {
    const name=req.params.name.toString();
    const token=req.params.token.toString();
    pool.query(
        "SELECT * FROM client WHERE name=$1 AND valid=$2 AND token=$3",
        [name,'Not',token],(err,result) => {
            if(err) throw err;
            if(result.rows.length===0){
                res.redirect('/');
            }
            else{
                res.render('Verify.ejs',{name:name,token:token});
            }
        }
    );
})

app.get('/test',(req,res) => {
    res.send('Hi')
})

app.get('/user',(req,res) => {
    if(req.isAuthenticated()){
        res.send(req.user);
    }
    else{
        res.send('no');
    }
})

// LOGIN ROUTES....

app.get('/login',NotCheckLog,(req,res) => {
    res.render('login.ejs',{red:req.flash('red')})
})

app.post('/login',NotCheckLog,(req,res,next) => {
    passport.authenticate('local',(err,user,info) => {
        if (err) throw err;
        if(!user){
            //res.redirect('/login')
            req.flash('red',info['message'])
            res.redirect('/login')
        }
        else{
            req.logIn(user,(err) => {
                if(err) throw err;
                res.redirect('/')
            })
        }
    })(req,res,next);

    app.delete('/logout',CheckLog,function(req,res){
        req.logOut()
        req.flash('green','Logged out')
        res.redirect('/')
    })
})


// PROJECT ROUTES.....

app.get('/projreport/:id',CheckLog,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT *FROM project WHERE project_id=$1",
        [id],(err,project) => {
            if(err) throw err;
            if(project.rows.length===0){
                res.redirect('/')
            }
            else if(project.rows[0].client_id==req.user.client_id){
                let exp=-1;
                let status;
                let today = new Date();
                let dd = String(today.getDate()).padStart(2, '0');
                let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                let yyyy = today.getFullYear();
                today = yyyy+mm+dd;
                pool.query(
                    "SELECT * FROM project WHERE project_id=$1",
                    [id],(err,project) => {
                        if(err) throw err;
                        pool.query(
                            "SELECT * FROM emp WHERE emp_id=$1",
                            [project.rows[0].emp_id],(err,emp) => {
                                if(err) throw err;
                                pool.query(
                                    "SELECT * FROM client WHERE client_id=$1",
                                    [project.rows[0].client_id],(err,c) => {
                                        if(err) throw err;
                                        pool.query(
                                            "SELECT * FROM bug WHERE project_id=$1",
                                            [id],(err,bugs) => {
                                                if(err) throw err;
                                                if(project.rows[0].enddate!=='Not'){
                                                    let deadline=project.rows[0].deadline;
                                                    deadline=deadline.split('-');
                                                    deadline[0]=Number(deadline[0]);
                                                    deadline[1]=Number(deadline[1]);
                                                    //deadline[2]=Number(deadline[2]);
                                                    deadline=deadline[1].toString()+"-"+deadline[0].toString()+"-"+deadline[2];
                                                    let enddate=project.rows[0].enddate;
                                                    enddate=enddate.split('-');
                                                    enddate[0]=Number(enddate[0]);
                                                    enddate[1]=Number(enddate[1]);
                                                    //enddate[2]=Number(enddate[2]);
                                                    enddate=enddate[1].toString()+"-"+enddate[0].toString()+"-"+enddate[2];
                                                    exp=datediff(parseDate(enddate), parseDate(deadline));
                                                    //console.log(exp);
                                                    status='Completed'
                                                }
                                                else{
                                                    let deadline=project.rows[0].deadline;
                                                    deadline=deadline.split('-');
                                                    deadline=deadline[2]+deadline[1]+deadline[0];
                                                    if(Number(today)<=Number(deadline)){
                                                        status='In progress...'
                                                    }
                                                    else{
                                                        status='Late'
                                                    }
                                                }
                                                exp=exp.toString();
                                                res.render('report1.ejs',{project:project.rows[0],bugs:bugs.rows,exp:exp,status:status,emp:emp.rows[0].name,c:c.rows[0].name,msg:req.flash('msg')});
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
            else{
                res.redirect('/')
            }
        }
    );
    
})

app.get('/clientproject/:id',CheckLog,(req,res) => {
    const id=Number(req.params.id);
    if(req.user.client_id==id){
        pool.query(
            "SELECT * FROM project WHERE client_id=$1",
            [id],(err,result) => {
                if(err) throw err;
                arr=[]
                //res.render('clientproject.ejs',{arr:result.rows});
                for(let i=0;i<result.rows.length;i++){
                    if(result.rows[i].description.length>20){
                        result.rows[i].description=result.rows[i].description.slice(0,20)+'...'
                    }
                    arr.push(result.rows[i])
                }
                res.render('clientproject.ejs',{arr:arr});
            }
        );
    }
})

app.get('/viewprojects',Admin,(req,res) => {
    let query = pool.query(
        "SELECT * FROM emp",(err,result) => {
            if(err) throw err;
            arr=[]
            for(let i=0;i<result.rows.length;i++){
                let client={key:result.rows[i].name+'-'+result.rows[i].branch,value:result.rows[i].name+'-'+result.rows[i].branch,text:result.rows[i].name+'-'+result.rows[i].branch};
                arr.push(client);
            }
            res.send(arr);
        }
    );
})

app.get('/viewclient/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today=yyyy+mm+dd;
    pool.query(
        "SELECT * FROM client WHERE client_id=$1",
        [id],(err,client) => {
            if(err) throw err;
            pool.query(
                "SELECT * FROM project WHERE client_id=$1",
                [id],(err,result) => {
                    if(err) throw err;
                    let a=0;
                    for(let i=0;i<result.rows.length;i++){
                        if(result.rows[i].enddate==='Not'){
                            let deadline=result.rows[i].deadline;
                            deadline=deadline.split('-');
                            deadline=deadline[2]+deadline[1]+deadline[0];
                            if(Number(deadline)>=Number(today)){
                                a=a+1;
                            }
                        }
                    }
                    const person=client.rows[0];
                    person['total']=result.rows.length;
                    person['current']=a;
                    res.send(person);
                }
            );
        }
    );
})



app.get('/projectreport/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let exp=-1;
    let status;
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    pool.query(
        "SELECT * FROM project WHERE project_id=$1",
        [id],(err,project) => {
            if(err) throw err;
            pool.query(
                "SELECT * FROM emp WHERE emp_id=$1",
                [project.rows[0].emp_id],(err,emp) => {
                    if(err) throw err;
                    pool.query(
                        "SELECT * FROM client WHERE client_id=$1",
                        [project.rows[0].client_id],(err,c) => {
                            if(err) throw err;
                            pool.query(
                                "SELECT * FROM bug WHERE project_id=$1",
                                [id],(err,bugs) => {
                                    if(err) throw err;
                                    if(project.rows[0].enddate!=='Not'){
                                        let deadline=project.rows[0].deadline;
                                        deadline=deadline.split('-');
                                        deadline[0]=Number(deadline[0]);
                                        deadline[1]=Number(deadline[1]);
                                        //deadline[2]=Number(deadline[2]);
                                        deadline=deadline[1].toString()+"-"+deadline[0].toString()+"-"+deadline[2];
                                        let enddate=project.rows[0].enddate;
                                        enddate=enddate.split('-');
                                        enddate[0]=Number(enddate[0]);
                                        enddate[1]=Number(enddate[1]);
                                        //enddate[2]=Number(enddate[2]);
                                        enddate=enddate[1].toString()+"-"+enddate[0].toString()+"-"+enddate[2];
                                        exp=datediff(parseDate(enddate), parseDate(deadline));
                                        //console.log(exp);
                                        status='Completed'
                                    }
                                    else{
                                        let deadline=project.rows[0].deadline;
                                        deadline=deadline.split('-');
                                        deadline=deadline[2]+deadline[1]+deadline[0];
                                        if(Number(today)<=Number(deadline)){
                                            status='In progress...'
                                        }
                                        else{
                                            status='Late'
                                        }
                                    }
                                    exp=exp.toString();
                                    console.log('Employee is as below')
                                    console.log(emp.rows);
                                    res.render('report.ejs',{project:project.rows[0],bugs:bugs.rows,exp:exp,status:status,emp:emp.rows[0].name,c:c.rows[0].name,msg:req.flash('msg')});
                                }
                            );
                        }
                    );
                }
            );
        }
    );
})

app.post('/completeproject/:id',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = dd+'-'+mm+'-'+yyyy;
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM bug WHERE project_id=$1 AND enddate=$2",
        [id,'Not'],(err,result) => {
            if(err) throw err;
            if(result.rows.length>0){
                req.flash('msg','Resolve all bugs first...')
                res.redirect('/projectreport/'+id.toString())
            }
            else
            {
                pool.query(
                    "UPDATE project SET enddate=$1 WHERE project_id=$2",
                    [today,id],(err,result) => {
                        if(err) throw err;
                        //res.send('Completed');
                        res.redirect('/projectreport/'+id.toString())
                    }
                );
            }
        }
    );
})

app.get('/deleteproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "DELETE FROM project WHERE project_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.redirect('/');
        }
    );
})

app.post('/editproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    const title=req.body.title;
    const description=req.body.description;
    const emp=req.body.emp;
    const client=req.body.client;
    const start=req.body.startdate;
    const deadline=req.body.deadline;
    let query = pool.query(
        "SELECT * FROM project WHERE emp_id=$1",
        [emp],(err,project) => {
            if(err) throw err;
            let a=0;
            let end;
            for(let i=0;i<project.rows.length;i++){
                if(project.rows[i].enddate==='Not'){
                    end=project.rows[i].deadline;
                    end=end.split('-');
                    end=end[2]+end[1]+end[0];
                    if(Number(today)<=Number(end)){
                        a=a+1;
                    }
                }
            }
            if(a>=5){
                req.flash('red','Employee is already in charge of 5 or more projects currently...')
                res.redirect('/editproject/'+id.toString())
            }
            else{
                pool.query(
                    "UPDATE project SET title=$1,description=$2,start=$3,deadline=$4,emp_id=$5,client_id=$6 WHERE project_id=$7",
                    [title,description,start,deadline,emp,client,id],(err,result) => {
                        if(err) throw err;
                        res.redirect('/projectreport/'+id.toString());
                    }
                );
            }
        }
    );
})

app.post('/deleteproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "DELETE FROM project WHERE project_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.redirect('/');
        }
    );
})



app.get('/editproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let e;
    let c;
    pool.query(
        "SELECT * FROM project WHERE project_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            pool.query(
                "SELECT * FROM emp",(err,emp) => {
                    if(err) throw err;
                    for(let i=0;i<emp.rows.length;i++){
                        if(emp.rows[i].emp_id===result.rows[0].emp_id){
                            e=emp.rows[i]
                            break;
                        }
                    }
                    pool.query(
                        "SELECT * FROM client",(err,clients) => {
                            if(err) throw err;
                            for(let j=0;j<clients.rows.length;j++){
                                if(clients.rows[j].client_id===result.rows[0].client_id){
                                    c=clients.rows[j]
                                    break;
                                }
                            }
                            res.render('editproject',{red:req.flash('red'),project:result.rows[0],users:emp.rows,e:e,clients:clients.rows,c:c})
                        }
                    );
                }
            );
        }
    );
})

app.get('/viewproject/:client/:employee',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today=yyyy+mm+dd;
    let client=req.params.client;
    let employee=req.params.employee;
    let deadline;
    employee=employee.split('-');
    let query = pool.query(
        "SELECT * FROM emp WHERE name=$1 AND branch=$2",
        [employee[0],employee[1]],(err,emp) => {
            if(err) throw err;
            pool.query(
                "SELECT * FROM client WHERE name=$1",
                [client],(err,result) => {
                    if(err) throw err;
                    pool.query(
                        "SELECT * FROM bug",(err,bugs) => {
                            if(err) throw err;
                            pool.query(
                                "SELECT * FROM project WHERE emp_id=$1 AND client_id=$2",
                                [emp.rows[0].emp_id,result.rows[0].client_id],(err,projects) => {
                                    if(err) throw err;
                                    let arr=[]
                                    let cnt=0;
                                    for(let i=0;i<projects.rows.length;i++){
                                        cnt=0;
                                        for(let j=0;j<bugs.rows.length;j++){
                                            if(bugs.rows[j].project_id===projects.rows[i].project_id && bugs.rows[j].enddate==='Not'){
                                                cnt=cnt+1;
                                            }
                                        }
                                        projects.rows[i]['bugs']=cnt;
                                        deadline=projects.rows[i].deadline;
                                        deadline=deadline.split('-');
                                        deadline=deadline[2]+deadline[1]+deadline[0];
                                        if(projects.rows[i].enddate!=='Not'){
                                            projects.rows[i]['status']='Completed'
                                        }
                                        else if(Number(today)<=Number(deadline)){
                                            projects.rows[i]['status']='In progress'
                                        }
                                        else{
                                            projects.rows[i]['status']='Late'  
                                        }
                                        if(projects.rows[i].description.length>20){
                                            projects.rows[i].description=projects.rows[i].description.slice(0,20)+'...'
                                        }
                                        arr.push(projects.rows[i]);
                                    }
                                    if(true){
                                        res.render('listprojects.ejs',{arr:arr});
                                    }
                                }
                            );
                        }
                    );
                }
            );
        }
    );
})

app.get('/addproject',Admin,(req,res) => {
    let query = pool.query(
        "SELECT * FROM emp",(err,result) => {
            if(err) throw err;
            //res.render('addproject.ejs',{red:'',users:result.rows});
            pool.query(
                "SELECT * FROM client",(err,clients) => {
                    if(err) throw err;
                    res.render('addproject.ejs',{red:req.flash('red'),users:result.rows,clients:clients.rows});
                }
            );
        }
    );
    
})

app.post('/addproject',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    const title=req.body.title;
    const description=req.body.description;
    const emp=req.body.emp;
    const client=req.body.client;
    const start=req.body.startdate;
    const deadline=req.body.deadline;
    let query = pool.query(
        "SELECT * FROM project WHERE emp_id=$1",
        [emp],(err,project) => {
            if(err) throw err;
            let a=0;
            let end;
            for(let i=0;i<project.rows.length;i++){
                if(project.rows[i].enddate==='Not'){
                    end=project.rows[i].deadline;
                    end=end.split('-');
                    end=end[2]+end[1]+end[0];
                    if(Number(today)<=Number(end)){
                        a=a+1;
                    }
                }
            }
            if(a>=5){
                req.flash('red','Employee is already in charge of 5 or more projects currently...')
                res.redirect('/addproject')
            }
            else{
                pool.query(
                    "INSERT INTO project(title,description,emp_id,client_id,start,deadline) VALUES($1,$2,$3,$4,$5,$6)",
                    [title,description,emp,client,start,deadline],(err,result) => {
                        if(err) throw err;
                        //res.redirect('http://localhost:3000/');
                        //res.redirect('/projectreport/'+result.rows[0].project_id.toString());
                        pool.query(
                            "SELECT * FROM project",(err,projects) => {
                                if(err) throw err;
                                m=0
                                for(let i=0;i<projects.rows.length;i++){
                                    if(projects.rows[i].project_id>m){
                                        m=projects.rows[i].project_id;
                                    }
                                }
                                res.redirect('/projectreport/'+m.toString());
                            }
                        );
                    }
                );
            }
        }
    );
})

// BUG ROUTES.....

app.get('/editbug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.render('editbug.ejs',{bug:result.rows[0]});
        }
    );
})

app.post('/editbug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const title=req.body.title;
    const description=req.body.description;
    const start=req.body.startdate;
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            pool.query(
                "UPDATE bug SET title=$1,description=$2,start=$3 WHERE bug_id=$4",
                [title,description,start,id],(err,results) => {
                    if(err) throw err;
                    res.redirect('/projectreport/'+result.rows[0].project_id.toString());
                }
            );
        }
    );
})

app.post('/deletebug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            pool.query(
                "DELETE FROM bug WHERE bug_id=$1",
                [id],(err,results) => {
                    if(err) throw err;
                    res.redirect('/projectreport/'+result.rows[0].project_id.toString());
                }
            );
        }
    );
})

app.get('/editbugs/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.render('editbugs.ejs',{remarks:result.rows[0].remarks,id:id})
        }
    );
})
app.post('/editbugs/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const remarks=req.body.remarks;
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            pool.query(
                "UPDATE bug SET remarks=$1 WHERE bug_id=$2",
                [remarks,id],(err,results) => {
                    if(err) throw err;
                    res.redirect('/projectreport/'+result.rows[0].project_id.toString());
                }
            );
        }
    );
})

app.get('/completebug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    res.render('completebug.ejs',{id:id})
})

app.post('/completebug/:id',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = dd+'-'+mm+'-'+yyyy;
    const id=Number(req.params.id);
    const remarks=req.body.remarks;
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            pool.query(
                "UPDATE bug SET remarks=$1,enddate=$2 WHERE bug_id=$3",
                [remarks,today,id],(err,results) => {
                    if(err) throw err;
                    res.redirect('/projectreport/'+result.rows[0].project_id.toString());
                }
            );
        }
    );
})

app.get('/addbug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    res.render('addbug.ejs',{id:id})
})

app.post('/addbug/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const title=req.body.title;
    const description=req.body.description;
    const start=req.body.startdate;
    pool.query(
        "INSERT INTO bug(title,description,project_id,start) VALUES($1,$2,$3,$4)",
        [title,description,id,start],(err,result) => {
            if(err) throw err;
            res.redirect('/projectreport/'+id.toString());
        }
    );
})

// NOTIFICATION ROUTES....

app.get('/notifications/new/:id',CheckLog,(req,res) => {
    const id=req.params.id;
    if(req.user.client_id==id){
        res.render('addclientproject.ejs',{id:id,red:''})
    }
    else{
        res.redirect('/')
    }
})

app.post('/addclientproject/:id',CheckLog,(req,res) => {

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = dd + '-' + mm + '-' + yyyy;

    const id=Number(req.params.id);
    if(req.user.client_id==id){
        const title=req.body.title;
        const description=req.body.description;
        const deadline=req.body.deadline;
        pool.query(
            "INSERT INTO project(title,description,deadline,client_id,start) VALUES ($1,$2,$3,$4,$5)",
            [title,description,deadline,id,today],(err,result) => {
                if(err) throw err;
                res.redirect('/');
            }
        );
    }
    else{
        res.redirect('/')
    }
})

app.post('/reply/:id',CheckLog,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM project WHERE project_id=$1",
        [id],(err,client) => {
            if(err) throw err;
            if(req.user.client_id==client.rows[0].client_id){
                if(req.body.reply){
                    pool.query(
                        "SELECT * FROM message WHERE project_id=$1 AND reply=$2",
                        [id,'Not'],(err,message) => {
                            if(err) throw err;
                            pool.query(
                                "UPDATE message SET reply=$1 WHERE message_id=$2",
                                ['Yes',Number(message.rows[0].message_id)],(err,result) => {
                                    if(err) throw err;
                                    pool.query(
                                        "UPDATE project SET deadline=$1 WHERE project_id=$2",
                                        [message.rows[0].deadline,id],(err,result) => {
                                            if(err) throw err;
                                            res.send(client.rows[0].client_id.toString());
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
                else{
                    pool.query(
                        "UPDATE message SET reply=$1 WHERE project_id=$2 AND reply=$3",
                        ['No',id,'Not'],(err,result) => {
                            if(err) throw err;
                            res.send(client.rows[0].client_id.toString());
                        }
                    );
                }
            }
            else{
                res.redirect('/')
            }
        }
    );
    
})

app.post('/extend/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const deadline=req.body.deadline;
    pool.query(
        "SELECT * FROM message WHERE project_id=$1 AND reply=$2",
        [id,'Not'],(err,result) => {
            if(err) throw err;
            if(result.rows.length>0){
                req.flash('msg','Pending Request...')
                res.redirect('/notifications/urgent')
            }
            else{
                pool.query(
                    "INSERT INTO message(project_id,deadline,reply) VALUES($1,$2,$3)",
                    [id,deadline,'Not'],(err,result) => {
                        if(err) throw err;
                        const pusher = new Pusher({
                            appId: '1055975',
                            key: 'ddb9920047594e5985e8',
                            secret: '6786fa44aa8068801e92',
                            cluster: 'ap2',
                            encrypted: true
                        });
                        
                        pusher.trigger('bug', 'deadline', {
                            project:id,
                            deadline:deadline
                        });
                        req.flash('msg','Request Queued...')
                        res.redirect('/notifications/urgent')
                    }
                );
            }
        }
    );
    
})

app.get('/clientmsg/:id',CheckLog,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM project WHERE project_id=$1",
        [id],(err,project) => {
            if(err) throw err;
            if(req.user.client_id==project.rows[0].client_id){
                pool.query(
                    "SELECT * FROM message WHERE project_id=$1 AND reply=$2",
                    [id,'Not'],(err,result) => {
                        if(err) throw err;
                        let arr=result.rows;
                        function compare(a, b) {
                            if (a.message_id > b.message_id) return -1;
                            if (b.message_id > a.message_id) return 1;
                            return 0;
                        }
                        arr.sort(compare);
                        res.send(arr);
                    }
                );
            }
            else{
                res.redirect('/')
            }
        }
    );
    
})

app.get('/notifications/new',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    let deadline;
    pool.query(
        "SELECT * FROM client",(err,result) => {
            if(err) throw err;
            let d={}
            for(let i=0;i<result.rows.length;i++){
                d[result.rows[i].client_id]=result.rows[i].name;
            }
            pool.query(
                "SELECT * FROM project",(err,result) => {
                    if(err) throw err;
                    let arr=[];
                    for(let i=0;i<result.rows.length;i++){
                        deadline=result.rows[i].deadline;
                        deadline=deadline.split('-');
                        deadline=deadline[2]+deadline[1]+deadline[0];
                        if(Number(today)<=Number(deadline) && result.rows[i].emp_id===null){
                            arr.push(result.rows[i]);
                        }
                    }
                    //res.send(arr);
                    function compare( a, b ) {
                        let m=a.start;
                        let n=b.start;
                        m=m.split('-');
                        m=m[2]+m[1]+m[0];
                        n=n.split('-');
                        n=n[2]+n[1]+n[0];
                        if (Number(m)<Number(n)){
                        return -1;
                        }
                        if (Number(m)>Number(n)){
                        return 1;
                        }
                        return 0;
                    }
                    
                    arr.sort(compare);
                    res.render('new.ejs',{arr:arr,d:d});
                }
            );
        }
    );
})

app.get('/viewclientproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const red=req.flash('red');
    pool.query(
        "SELECT * FROM emp",(err,result) => {
            if(err) throw err;
            res.render('completeproject.ejs',{users:result.rows,id:id,red:red})
        }
    );
})

app.post('/addproject/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const start=req.body.startdate;
    const emp=Number(req.body.emp);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    pool.query(
        "SELECT * FROM project WHERE emp_id=$1 AND enddate=$2",
        [emp,'Not'],(err,results) => {
            if(err) throw err;
            let a=0;
            for(let i=0;i<results.rows.length;i++){
                let deadline=results.rows[i].deadline;
                deadline=deadline.split('-');
                deadline=deadline[2]+deadline[1]+deadline[0];
                if(Number(deadline)>=Number(today)){
                    a=a+1;
                }
            }
            if(a>=5){
                req.flash('red','Employee is already working on 5 projects...')
                res.redirect('/viewclientproject/'+id.toString());
            }
            else{
                pool.query(
                    "UPDATE project SET emp_id=$1,start=$2 WHERE project_id=$3",
                    [emp,start,id],(err,result) => {
                        if(err) throw err;
                        res.redirect('/projectreport/'+id.toString());
                    });     
            }
        });
    
})

app.get('/testing',(req,res) => {
    pool.query(
        "SELECT * FROM project",(err,result) => {
            if(err) throw err;
            let arr=[]
            for(let i=0;i<result.rows.length;i++){
                if(result.rows[i].emp_id===null){
                    arr.push(result.rows[i]);
                }
            }
            res.send(arr);
        }
    );
})


app.get('/notifications/urgent/:id',CheckLog,(req,res) => {
    console.log('Hey there');
    const id=Number(req.params.id);
    if(req.user.client_id==id){
        let today = new Date();
        let dd = Number(String(today.getDate()).padStart(2, '0'));
        let mm = Number(String(today.getMonth() + 1).padStart(2, '0')); //January is 0!
        let yyyy = Number(today.getFullYear());
        today = mm.toString()+'-'+dd.toString()+'-'+yyyy.toString();
        let deadline;
        let d={}
        let left;
        pool.query(
            "SELECT * FROM message WHERE reply=$1",
            ['Not'],(err,messages) => {
                if(err) throw err;
                for(let i=0;i<messages.rows.length;i++){
                    d[messages.rows[i].project_id]=messages.rows[i].deadline
                }
                pool.query(
                    "SELECT * FROM project",(err,result) => {
                        if(err) throw err;
                        let arr=[]
                        for(let i=0;i<result.rows.length;i++){
                            deadline=result.rows[i].deadline;
                            deadline=deadline.split('-');
                            deadline[0]=Number(deadline[0]);
                            deadline[1]=Number(deadline[1]);
                            deadline[2]=Number(deadline[2]);
                            deadline=deadline[1].toString()+'-'+deadline[0].toString()+'-'+deadline[2].toString();
                            left=datediff(parseDate(today), parseDate(deadline));
                            if(Number(left)>=0 && Number(left)<=5 && result.rows[i].enddate==='Not' && result.rows[i].client_id===id){
                                result.rows[i]['left']=left;
                                if(result.rows[i].description.length>20){
                                    result.rows[i].description=result.rows[i].description.slice(0,20)+'...'
                                }
                                arr.push(result.rows[i]);
                            }
                        }
                        res.render('urgent1.ejs',{arr:arr,d:d});
                    }
                );
            }
        );
    }
    else{
        res.redirect('/')
    }
    

})

app.get('/notifications/urgent',Admin,(req,res) => {
    let today = new Date();
    let dd = Number(String(today.getDate()).padStart(2, '0'));
    let mm = Number(String(today.getMonth() + 1).padStart(2, '0')); //January is 0!
    let yyyy = Number(today.getFullYear());
    today = mm.toString()+'-'+dd.toString()+'-'+yyyy.toString();
    let deadline;
    let left;
    pool.query(
        "SELECT * FROM project",(err,result) => {
            if(err) throw err;
            let arr=[]
            for(let i=0;i<result.rows.length;i++){
                deadline=result.rows[i].deadline;
                deadline=deadline.split('-');
                deadline[0]=Number(deadline[0]);
                deadline[1]=Number(deadline[1]);
                deadline[2]=Number(deadline[2]);
                deadline=deadline[1].toString()+'-'+deadline[0].toString()+'-'+deadline[2].toString();
                left=datediff(parseDate(today), parseDate(deadline));
                if(left>=0 && left<=5 && result.rows[i].enddate==='Not' && result.rows[i].emp_id!==null){
                    result.rows[i]['left']=left;
                    if(result.rows[i].description.length>20){
                        result.rows[i].description=result.rows[i].description.slice(0,20)+'...'
                    }
                    arr.push(result.rows[i]);
                }
            }
            res.render('urgent.ejs',{arr:arr,msg:req.flash('msg')});
        }
    );
})

// USER ROUTES....

app.post('/edit/employee/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    const name=req.body.name;
    const phone=req.body.phone;
    const branch=req.body.branch;
    let email_name=name.split(' ');
    let s=''
    for(let i=0;i<email_name.length;i++){
        s=s+email_name[i];
    }
    s=s+"_"+branch[0];
    s=s.toLowerCase();
    const email=s+'@company.com';
    let query = pool.query(
        "UPDATE emp SET name=$1,phone=$2,branch=$3,email=$4 WHERE emp_id=$5",
        [name,phone,branch,email,id],(err,result) => {
            if(err) throw err;
            res.redirect('/employee/'+name+'-'+branch);
        }
    );
})

app.get('/edit/employee/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let query = pool.query(
        "SELECT * FROM emp WHERE emp_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.render('editemployee.ejs',{emp:result.rows[0],exist:''});
        }
    );
})

app.get('/delete/employee/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    let query = pool.query(
        "DELETE FROM emp WHERE emp_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.redirect('/')
        }
    );
})


app.get('/viewemployees',(req,res) => {
    console.log(req.user)
    pool.query(
        "SELECT * FROM emp",(err,result) => {
            if(err) throw err;
            res.send(result.rows);
        }
    );
})

app.get('/verifyproject/emp',Admin,(req,res) => {
    pool.query(
        "SELECT * FROM client",(err,result) => {
            if(err) throw err;
            m={}
            for(let i=0;i<result.rows.length;i++){
                let client={key:result.rows[i].name,value:result.rows[i].name,text:result.rows[i].name};
                m[result.rows[i].client_id]=client;
            }
            pool.query(
                "SELECT * FROM project WHERE emp_id>$1",[0],(err,results) => {
                    if(err) throw err;
                    d={};
                    for(let i=0;i<results.rows.length;i++){
                        d[results.rows[i].emp_id]=[]
                    }
                    for(let i=0;i<results.rows.length;i++){
                        if(!d[results.rows[i].emp_id].includes(m[results.rows[i].client_id])){
                            d[results.rows[i].emp_id].push(m[results.rows[i].client_id]);
                        }
                    }
                    res.send(d);
                }
            );
        }
    );
})

app.get('/verifyproject/client',Admin,(req,res) => {
    pool.query(
        "SELECT * FROM emp",(err,result) => {
            if(err) throw err;
            m={}
            for(let i=0;i<result.rows.length;i++){
                let client={key:result.rows[i].name+'-'+result.rows[i].branch,value:result.rows[i].name+'-'+result.rows[i].branch,text:result.rows[i].name+'-'+result.rows[i].branch};
                m[result.rows[i].emp_id]=client;
            }
            pool.query(
                "SELECT * FROM project WHERE emp_id>$1",[0],(err,results) => {
                    if(err) throw err;
                    d={};
                    for(let i=0;i<results.rows.length;i++){
                        d[results.rows[i].client_id]=[]
                    }
                    for(let i=0;i<results.rows.length;i++){
                        if(!d[results.rows[i].client_id].includes(m[results.rows[i].emp_id])){
                            d[results.rows[i].client_id].push(m[results.rows[i].emp_id]);
                        }
                    }
                    res.send(d);
                }
            );
        }
    );
})


app.get('/addemployee',Admin,(req,res) => {
    res.render('addemployee.ejs',{exist:req.flash('exist')})
})

app.post('/addemployee',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = dd+'-'+mm+'-'+yyyy;
    const name=req.body.name;
    const phone=req.body.phone;
    const branch=req.body.branch;
    let email_name=name.split(' ');
    let s=''
    for(let i=0;i<email_name.length;i++){
        s=s+email_name[i];
    }
    s=s+"_"+branch[0];
    s=s.toLowerCase();
    const email=s+'@company.com';
    let query = pool.query(
        "INSERT INTO emp(name,email,phone,joined,branch) VALUES($1,$2,$3,$4,$5)",
        [name,email,phone,today,branch],(err,result) => {
            if(err) throw err;
            res.redirect('/')
        }
    ); 
})

app.get('/bugs',(req,res) => {
    pool.query(
        "SELECT * FROM bug",(err,result) => {
            if(err) throw err;
            res.send(result.rows);
        }
    ); 
})

app.get('/bugtracker/:id',(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM bug WHERE bug_id=$1",
        [id],(err,bug) => {
            if(err) throw err;
            pool.query(
                "SELECT * FROM bug WHERE title=$1",
                [bug.rows[0].title],(err,result) => {
                    if(err) throw err;
                    res.render('bug.ejs',{bugs:result.rows});
                }
            );
        }
    );
})

app.get('/employee/:employee',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    let curr=[];
    let exp;
    console.log(req.params.employee);
    let ar=req.params.employee.split('-');
    console.log(ar);
    curr.push(yyyy);
    curr.push(mm);
    curr.push(dd);
    let query = pool.query(
        "SELECT * FROM emp WHERE name=$1 AND branch=$2",
        [ar[0],ar[1]],(err,result) => {
            if(err) throw err;
            console.log('Employee is as follows below:')
            console.log(result.rows[0]);
            //const id=result.rows[0].emp_id;
            const id=Number(result.rows[0].emp_id);
            let joined=result.rows[0].joined;
            joined=joined.split('-');
            let arr=[]
            for(let k=0;k<3;k++){
                arr.push(Number(curr[k])-Number(joined[2-k]))
            }
            if(arr[2]<0){
                arr[1]=arr[1]-1
            }
            if(arr[1]<0){
                arr[0]=arr[0]-1;
                arr[1]=arr[1]+12;
            }
            if(arr[0]===0){
                if(arr[1]===0){
                    exp='Less than a month';
                }
                else if(arr[1]===1){
                    exp='1 Month';
                }
                else{
                    exp=arr[1].toString()+" Months";
                }
            }
            else{
                if(arr[1]===0){
                    if(arr[0]===1){
                        exp='1 Year';
                    }
                    else{
                        exp=arr[0].toString()+" Years";
                    }
                }
                else if(arr[1]===1){
                    if(arr[0]===1){
                        exp='1 Year 1 Month';
                    }
                    else{
                        exp=arr[0].toString()+" Years 1 Month";
                    }
                }
                else{
                    if(arr[0]===1){
                        exp='1 Year '+arr[1].toString()+" Months";
                    }
                    else{
                        exp=arr[0].toString()+" Years "+arr[1].toString()+" Months";
                    } 
                }
            }


            let a=0;
            let b=0;
            let c=0;
            let deadline;
            pool.query(
                "SELECT * FROM project WHERE emp_id=$1",
                [id],(err,projects) => {
                    if(err) throw err;
                    for(let i=0;i<projects.rows.length;i++){
                        if(projects.rows[i].enddate=='Not'){
                            deadline=projects.rows[i].deadline;
                            deadline=deadline.split('-');
                            deadline=deadline[2]+deadline[1]+deadline[0];
                            if(Number(today)<=Number(deadline)){
                                b=b+1;
                            }
                            else{
                                a=a+1;
                            }
                        }
                        else{
                            c=c+1;
                        }
                    }
                    let d=a+b+c;
                    res.render('viewuser.ejs',{emp:result.rows[0],a:a,b:b,c:c,d:d,exp:exp})
                }
            );
        }
    );
})


//CLIENT ROUTES.....

app.delete('/client/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "DELETE FROM client WHERE client_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.send("Client Deleted");
        }
    );
})

app.get('/viewallclients',Admin,(req,res) => {
    console.log('Clients')
    pool.query(
        "SELECT * FROM client",(err,result) => {
            if(err) throw err;
            res.send(result.rows);
        }
    );
})



app.get('/client/:client',Admin,(req,res) => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy+mm+dd;
    let query = pool.query(
        "SELECT * FROM client WHERE name=$1",
        [req.params.client],(err,result) => {
            let client=result.rows[0];
            if(err) throw err;
            const id=client.client_id;
            pool.query(
                "SELECT * FROM project WHERE client_id=$1",
                [id],(err,projects) => {
                    if(err) throw err;
                    let a=0;
                    let b=0;
                    let deadline;
                    for(let i=0;i<projects.rows.length;i++){
                        if(projects.rows[i].enddate=='Not'){
                            deadline=projects.rows[i].deadline;
                            deadline=deadline.split('-');
                            deadline=deadline[2]+deadline[1]+deadline[0];
                            if(Number(today)<=Number(deadline)){
                                a=a+1;
                                b=b+1;
                            }
                        }
                        else{
                            b=b+1;
                        }
                    }
                    res.render("viewclient",{client:client,a:a,b:b});
                }
            );
        }
    );
})

app.get('/viewclients',Admin,(req,res) => {
    
    pool.query(
        "SELECT * FROM client",(err,result) => {
            if(err) throw err;
            res.send(result.rows);
        }
    );
})

app.get('/addclient',Admin,(req,res) => {
    res.render('addclient.ejs',{exist:req.flash('exist')})
})

app.get('/editclient/:id',Admin,(req,res) => {
    const id=Number(req.params.id);
    pool.query(
        "SELECT * FROM client WHERE client_id=$1",
        [id],(err,result) => {
            if(err) throw err;
            res.render('Editclient.ejs',{client:result.rows[0],exist:req.flash('exist')});
        }
    );
})

app.post('/editclient/:id',Admin,(req,res) => {
    const name=req.body.name;
    const email=req.body.email;
    const id=Number(req.params.id);
    const password=req.body.password;
    pool.query(
        "SELECT * FROM client WHERE name=$1 OR email=$2",
        [name,email],(err,result) => {
            if(err) throw err;
            if(result.rows.length===0){
                req.flash('exist','Client already exists!!!');
                res.redirect('/editclient/'+id.toString());
            }
            else{
                pool.query(
                    "UPDATE client SET name=$1 WHERE id=$2",
                    [desc,id],(err,result) => {
                        if(err) throw err;
                        res.send("Updated...");
                    }
                );
            }
        }
    );
})

app.post('/addclient',Admin,async(req,res) => {
    const name=req.body.name;
    const email=req.body.email;
    const phone=req.body.phone;
    const token=randomstring.generate();
    let query = pool.query(
        "SELECT * FROM client WHERE name=$1 OR email=$2",
        [name,email],async (err,result) => {
            if(err) throw err;
            if(result.rows.length>0){
                req.flash('exist','Client already exists!!!')
                res.redirect('/addclient');
            }
            else{
                await send(email,name,token);
                pool.query(
                    "INSERT INTO client(name,email,phone,token) VALUES($1,$2,$3,$4)",
                    [name,email,phone,token],(err,result) => {
                        if(err) throw err;
                        res.redirect('/');
                    }
                );
            }
        }
    ); 
})

app.use(express.static(path.join(__dirname,'client/build')));
    app.get('*',(req,res) => {
        res.sendFile(path.resolve(__dirname,'client','build','index.html'));
    })

app.listen(PORT,() => {
    console.log(`Server has started on port ${PORT}!!`)
})