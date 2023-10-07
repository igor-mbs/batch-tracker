//server.js---------------------------------------------------------------------------------------------------
require('dotenv').config() //check if this is necessary in final product


//------------------------------------------- < database START ------------------------------------------------
//const pg = require('pg');
const {Pool, Client} = require('pg');
//const connect = process.env.CONSTRING;
const pool = new Pool()
const client = new Client()
// const client = new Client({
//     host: 'localhost',
//     user: 'batch_finder_user',
//     pasword:'1234',
//     database:'batch_finder',
//     port: 5432
// })
client.connect()
//------------------------------------------- database END > ------------------------------------------------


//------------------------------------------- < definitions START --------------------------------------------
clearencemessage = null
errormessage = null
batchmessage = null

const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const fs = require('fs');
const http = require('http');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
var Chart = require('chart.js');

const express = require('express');
const app = express()

const passport = require('passport');
//const initializePassport = require('./passport-config.js')
// initializePassport(
//     passport,
//     email => users.find(user => user.email === email),
//     id => users.find(user => user.id === id)
// );

//function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {

        userdata = await client.query("select * from users where email = $1", [email])
        user = userdata.rows[0]
        if (user == null) {
            return done(null, false, {message: 'Login failed: 1.'})
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, {message: 'Login failed: 2.'})
            }
        } catch(e){
            return done(e)
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, authenticateUser))
    passport.serializeUser( (user, done) => done(null, user.user_id) )
    passport.deserializeUser( (id, done) => { return done(null, user.user_id === id) } )
//}

app.set('views', __dirname + '/public')
app.set('view-engine', 'ejs')
app.engine('html', require('ejs').renderFile)
//let ejs = require('ejs')

app.use(express.urlencoded({ extended: false }))
app.use(flash())

app.use(session({
    secret: process.env.SESSION_SECRET,  //genereta a randomic secret key and atribute it to SESSION_SECRET
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } //1 Hour = 3600000; 30 Seconds = 30000
}))

app.use(passport.initialize())
app.use(passport.session())
//------------------------------------------- definitions END > -----------------------------------------------


//---------------------------------- < PORT and app inicialization START --------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n------> App running on port ${PORT}.\n`));
//----------------------------------- PORT and app inicialization END > ---------------------------------------


//------------------------------------ < credentials engine START ------------------------------------------
// app.get('/id', (req, res) => {
//     const vv = req.session.passport.user
//     const uu = req.user 
//     const ii = req.sessionID
//     const cc = req.session.cookie
//    console.log('----------------------------------------------\n req.sessionID:')
//    console.log(ii)
//    console.log('\n req.session.cookie:')
//    console.log(cc)
//    console.log('\n req.user:')
//    console.log(uu)
//    console.log('\n req.session.passport.user:')
//    console.log(vv)
//    console.log('----------------------------------------------')
//    res.redirect('/')
// })

app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true
}))

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});
//app.get('/logout', function (req, res) {
//    res.cookie('connect.sid', '', { expires: new Date(1), path: '/' });
//    req.logOut();
//    res.clearCookie('connect.sid', { path: '/' });
//    res.redirect('/');
//});

//------------------------------------ < Register User START ------------------------------------------
async function clearenceFunction (modemail, modpassword) {
    moddata = await client.query("select * from users where email = $1", [modemail])
    mod = moddata.rows[0]

    if (mod == null) {
        return false
    }
    if (mod.type == 'user') {
        return false
    }
    try {
        if (await bcrypt.compare(modpassword, mod.password)) {
            return true
        } else {
            return false
        }
    } catch(err){
        return err
    }
}

app.post('/register', authenticated, async (req, res) => {
    creation_address = req.ip
    console.log('\n -----creation_address:')
    console.log(creation_address)

    otheraddressmethod = req.connection.remoteAddress
    console.log('\n -----otheraddressmethod:')
    console.log(otheraddressmethod)

    modemail = req.body.moduser
    modpassword = req.body.modpassword
    namefirst = req.body.regfirst
    namelast = req.body.reglast
    reguser = req.body.regemail
    regpass1 = req.body.regpassword1
    regpass2 = req.body.regpassword2
    radios = req.body.classradio

    var clearenceCheck = await clearenceFunction(modemail, modpassword);
    console.log('\n clearenceCheck:')
    console.log(clearenceCheck)

    var repeatedPasswordCheck = (regpass1 === regpass2)
    console.log('\n repeatedPasswordCheck:')
    console.log(repeatedPasswordCheck)

    if ( repeatedPasswordCheck == true && clearenceCheck == true ) {

        console.log('Passwords match. [V]')
        console.log('Clearence accepted. [V]')

        reguserdata = await client.query("select * from users where email = $1", [reguser])
        reguserobj = reguserdata.rows[0]

        const hashedRegPassword = await bcrypt.hash(regpass2, 10)
        const hashedModPassword = await bcrypt.hash(modpassword, 10)
            
        if (reguserobj == undefined) {
            try {
                console.log('------------------ registered new [1] ---------------------')
                await client.query("insert into users (user_id, creation_date, creation_address, moderator, mod_pass, email, first_name, last_name, password, type, modified_date) values (default, default, $1, $2, $3, $4, $5, $6, $7, $8, null)", [creation_address, modemail, hashedModPassword, reguser, namefirst, namelast, hashedRegPassword, radios])
                console.log('------------------ registered new [2] ---------------------')
                res.redirect('/home').status(201).send()
            } catch(err){
                return err
            }
        } else {
            try {
                console.log('------------------ updated [1] ---------------------')
                await client.query("update users set creation_address=$1, moderator=$2, mod_pass=$3, email=$4, first_name=$5, last_name=$6, password=$7, type=$8, modified_date=default where user_id = $9", [creation_address, modemail, hashedModPassword, reguser, namefirst, namelast, hashedRegPassword, radios, reguserobj.user_id])
                console.log('------------------ updated [2] ---------------------')
                res.redirect('/home').status(201).send()
            } catch(err){
                return err
            }
        }
    } else if (repeatedPasswordCheck == true && clearenceCheck == false) {
        res.render('register.ejs', {clearencemessage : 'Clearence denied.'})
        console.log('Clearence denied. [X]')

    } else if (repeatedPasswordCheck == false && clearenceCheck == true) {
        res.render('register.ejs', {errormessage : 'Passwords mismatch.'})
        console.log('Passwords mismatch. [X]')

    } else if (repeatedPasswordCheck == false && clearenceCheck == false) {
        res.render('register.ejs', {clearencemessage : 'Clearence denied.', errormessage : 'Passwords mismatch.'})
        console.log('Clearence denied. [X]')
        console.log('Passwords mismatch. [X]')
    }
})
//------------------------------------ Register User END > ------------------------------------------

//------------------------------------ < Edit Own User Info. START ------------------------------------------
async function clearenceEditFunction (useremail, userpassword) {
    userdata = await client.query("select * from users where email = $1", [useremail])
    userforedit = userdata.rows[0]

    if (userforedit == null) {
        return false
    }
    try {
        if (await bcrypt.compare(userpassword, userforedit.password)) {
            return true
        } else {
            return false
        }
    } catch(err){
        return err
    }
}

app.post('/edituser', authenticated, async (req, res) => {
//app.post('/edituser', async (req, res) => {
    creation_address = req.ip
    console.log('\n -----creation_address:')
    console.log(creation_address)

    otheraddressmethod = req.connection.remoteAddress
    console.log('\n -----otheraddressmethod:')
    console.log(otheraddressmethod)

    useremail = req.body.useremail
    userpassword = req.body.userpassword
    namefirst = req.body.regfirst
    namelast = req.body.reglast
    reguser = req.body.regemail
    regpass1 = req.body.regpassword1
    regpass2 = req.body.regpassword2
    // radios = req.body.classradio

    var clearenceEditCheck = await clearenceEditFunction (useremail, userpassword)
    console.log('\n clearenceForEdit:')
    console.log(clearenceEditCheck)

    var repeatedPasswordCheck = (regpass1 === regpass2)
    console.log('\n repeatedPasswordCheck:')
    console.log(repeatedPasswordCheck)

    if ( repeatedPasswordCheck == true && clearenceEditCheck == true ) {

        console.log('Passwords match. [V]')
        console.log('Clearence accepted. [V]')

        reguserdata = await client.query("select * from users where email = $1", [useremail])
        reguserobj = reguserdata.rows[0]

        // const hashedUserpassword = await bcrypt.hash(userpassword, 10)
        const hashedRegPassword = await bcrypt.hash(regpass2, 10)

        if (reguserobj == undefined) {
            res.render('edituser.ejs', {errormessage : 'User does not exist.'})
        } else {
            try {
                console.log('------------------ updated [1] ---------------------')
                await client.query("update users set email=$1, first_name=$2, last_name=$3, password=$4, modified_date=default where user_id = $5", [reguser, namefirst, namelast, hashedRegPassword, reguserobj.user_id])
                console.log('------------------ updated [2] ---------------------')
                res.redirect('/home').status(201).send()
            } catch(err){
                return err
            }
        }
    } else if (repeatedPasswordCheck == true && clearenceEditCheck == false) {
        res.render('edituser.ejs', {clearencemessage : 'Clearence denied.'})
        console.log('Clearence denied. [X]')

    } else if (repeatedPasswordCheck == false && clearenceEditCheck == true) {
        res.render('edituser.ejs', {errormessage : 'Passwords mismatch.'})
        console.log('Passwords mismatch. [X]')

    } else if (repeatedPasswordCheck == false && clearenceEditCheck == false) {
        res.render('edituser.ejs', {clearencemessage : 'Clearence denied.', errormessage : 'Passwords mismatch.'})
        console.log('Clearence denied. [X]')
        console.log('Passwords mismatch. [X]')
    }
})
//------------------------------------ Edit Own User Info. END > ------------------------------------------
//------------------------------------ credentials engine END > ------------------------------------------


//---------------------------------- < session authenticated router START -------------------------------------
app.use(express.static(path.join(__dirname, 'public')));  //address router for static files in "public" folder


function authenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
};

function notAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/home')
    }
    next()
};

app.get('/home', authenticated, (req, res) => {
    //res.redirect('/home')
    res.render('home.ejs', {})
});

app.get('/register', authenticated, (req, res) => {
    //res.redirect('/register')
    res.render('register.ejs', {})
});

app.get('/edituser', authenticated, (req, res) => {
//app.get('/edituser', (req, res) => {
    //res.redirect('/edituser')
    res.render('edituser.ejs', {})
});

app.get('/', notAuthenticated, (req, res) => {
    //res.redirect('/index')
    res.render('index.ejs', {})
});

app.post('/search', authenticated, async (req, res) => {
    //insert into batches (batch_id, batch_code, sm_ajustagem, sm_conformacao_manual, sm_corte_router, sm_dobradeira, sm_inspecao, sm_liquido_penetrante_ndt, sm_montagem , sm_pintura_e_identificacao, sm_prensa, sm_rebarbagem, sm_shot_peening, sm_tratamento_superficie_alodine_e_anodizacao, sm_tratamento_superficie_tsa, sm_tratamento_termico_envelhecimento, sm_tratamento_termico_solubilizacao) values (default, '333', default, default, default, default, default, default, default, default, null, null, default, default, default, default, default)
    batchnumber = req.body.batchnumbersearch
    const batchdata = await client.query("select * from batches where batch_code=$1", [batchnumber]) 
    batchobj = batchdata.rows[0]

    if (batchobj==undefined) {
        res.render('home.ejs', {batchmessage: 'Batch not found.'})
    } else {
    res.render('batch.ejs', {batchobj})
    }
});

app.get('/analytics', authenticated, (req, res) => {
        res.render('analytics.ejs', {})
});
app.get('/Chart.bundle.js', authenticated, function(req, res) {
    res.sendFile(__dirname + '/node_modules/chart.js/dist/Chart.bundle.js');
});
   

// app.get('/batch', notAuthenticated, (req, res) => {
//     //res.redirect('/index')
//     res.render('batch.ejs', {})
// })

app.use(function (req, res, next) {
    //    res.status(404).redirect('/404.ejs')//.send("sorry can't find that!")
        res.status(404).render('404.ejs')//.send("sorry can't find that!")
});
//---------------------------------- session authenticated router END > ---------------------------------------


//-------------------------------------- < batch tracking START -------------------------------------------


//insert into batches (batch_id, batch_code, sm_ajustagem, sm_conformacao_manual, sm_corte_router, sm_dobradeira, sm_inspecao, sm_liquido_penetrante_ndt, sm_montagem , sm_pintura_e_identificacao, sm_prensa, sm_rebarbagem, sm_shot_peening, sm_tratamento_superficie_alodine_e_anodizacao, sm_tratamento_superficie_tsa, sm_tratamento_termico_envelhecimento, sm_tratamento_termico_solubilizacao) values (default, '333', default, default, default, default, default, default, default, default, null, null, default, default, default, default, default)


// async function batchSearch (batchnumber, batchobj) {
// console.log('\n batchnumber 2:')
// console.log(batchnumber)

// batchdata = await client.query("select * from batches where batch_code=$1", [batchnumber])
// console.log('\n batchdata:')
// console.log(batchdata)

// batchobj = batchdata.rows[0]
// console.log('\n batchobj 2:')
// console.log(batchobj)

// }
//-------------------------------------- batch tracking END > ----------------------------------------------