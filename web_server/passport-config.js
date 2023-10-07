
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email)
        if (user == null) {
            return done(null, false, {message: 'User not found.'})
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, {message: 'Incorrect password.'})
            }
        } catch(e){
            return done(e)
        }
    }

    // passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, authenticateUser))
    // passport.serializeUser((user, done) => done(null, user.id))
    // passport.deserializeUser((id, done) => {
    //     return done(null, getUserById(id))
    passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.email))
    passport.deserializeUser((email, done) => {
        return done(null, getUserByEmail(email))
    })
}

module.exports = initialize


// //function initialize(passport, getUserByEmail, getUserById) {
//     // const doborigado = async (email) => {
//     //         await client.connect()
//     //         userdata = await client.query("select * from users where email = $1", [email])
//     //         await client.end()
//     //         console.log('----> userdata:')
//     //         console.log(userdata)
    
//     //         userobject = userdata.rows[0]

//     //         console.log('----> userobject:')
//     //         console.log(userobject)

//     //     }

//     const authenticateUser = async (email, password, done) => {
//         //await client.connect()
//         userdata = await client.query("select * from users where email = $1", [email])
//         //await client.end()
//         console.log('----> userdata:')
//         console.log(userdata)

//         userobject = userdata.rows[0]

//         console.log('----> userobject:')
//         console.log(userobject)

//         const user = userobject
//             //users.find(async user => user.email === email) //getUserByEmail(email)
//         if (user == null) {
//             return done(null, false, {message: 'User not found.'})
//         }
//         try {
//             if (await bcrypt.compare(password, user.password)) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, {message: 'Incorrect password.'})
//             }
//         } catch(e){
//             return done(e)
//         }
//     }

//     passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, authenticateUser))
//     passport.serializeUser((user, done) => done(null, user.user_id))
//     passport.deserializeUser((id, done) => {
//         return done(null, users.find(user => user.user_id === id)) //getUserById(id))
//     })

//     // passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, authenticateUser))
//     // passport.serializeUser((user, done) => done(null, user.email))
//     // passport.deserializeUser((email, done) => {
//     //     return done(null, getUserByEmail(email))
// //}