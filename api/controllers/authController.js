require('dotenv').config()
'use strict'
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const pg = require('pg');
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}
);
const exec = require('child_process').exec;
const serverRepositoryPath = process.env.SERVER_REPOSITORY_PATH;
const deployBranch = process.env.DEPLOY_BRANCH;
const format = require('pg-format');


exports.hello_world = function (req, res) {
    res.end(`Hello world`);
}


exports.github_deployment = function (req, res) {
    if (req.body.ref === deployBranch) {
        exec('cd ' + serverRepositoryPath + ' && git reset --hard && git pull && npm install && pm2 restart grupa6Servis_Server');
    }
}

exports.log_the_user = function (req, res) {
    //request body contains the users username and password
    //we first look for the user in the array
    // #swagger.tags = ['Authentication']
    // #swagger.description = 'Endpoint for logging in'

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               description: 'User login information.',
               required: true,
               type: 'object',
               schema: { "email": "email", "password": "password" }
        } */
    pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [req.body.email]).then(dbResponse => {
        const found = dbResponse.rows[0];
        bcrypt.compare(req.body.password, found.Password, function (req1, res1) {
            if (res1) {

                if (found.QrSecret !== null) {
                    const jwtPayload = { needTwoFA: true, userId: found.UserId };
                    const accessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' })
                    res.status(202).json({ accessToken: accessToken }); // #swagger.responses[202] = { schema: {"accessToken": "accessToken"} }
                } else {
                    JWTResponseWithUser(found, res);
                }
                //the secret is loaded from the environment variable and expiration is set in 30 mins
            } else {
                res.status(400).json({ message: "The password is incorrect" }) // #swagger.responses[400] = { schema: {"message": "The password is incorrect"} }
            }
        })
    }, err => {
        res.status(401).json({ message: "User does not exist" }) // #swagger.responses[401] = { schema: {"message": "User does not exist"} }
    }).catch(err => {
        res.status(401).json({ message: "User does not exist" })
    });
}

exports.verify_the_user = function (req, res) {
    //token is recieved in the header as "Bearer <token>"
    // #swagger.tags = ['Authentication']

    // #swagger.description = 'Endpoint for verifying the access token'

    /* #swagger.parameters['JWT'] = {
               in: 'header',
               description: 'Jwt verification.',
               required: true,
               type: 'string',
               name: 'Authorization',
               description: 'Bearer token'
        } */
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        //if the payload doesn't contain roleId or groupId the token is used for something else (2fa/resetPass)
        //and can't be used to access resources
        if (err || !user.hasOwnProperty('roleId') || !user.hasOwnProperty('groupId')) {
            return res.sendStatus(403) // #swagger.responses[403]
        }
        //this route is called whenever the user makes a request towards the server so a new token is generated
        //and returned in the body along with some user info
        const userCopy = { id: user.id, email: user.email, roleId: user.roleId, groupId: user.groupId };
        const newAccessToken = jwt.sign(userCopy, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        userCopy.accessToken = newAccessToken;
        res.json(userCopy) // #swagger.responses[200] = { schema: {"id": "number", "email": "string", "roleId": "number", "groupId": "number", "accessToken": "string"} }
    })
};

// GET /QRcode
exports.authenticator_2fa = function (req, res) {
    //returns a QRcode image for the user to scan with an google authenticator app
    //and the generated secret for the user
    // #swagger.tags = ['Authentication']
    const secret = speakeasy.generateSecret({})
    qrcode.toDataURL(secret.otpauth_url, (er, data) => {
        res.json({ QrSecret: secret, QRcode: data }) //place QRcode inside of src of the img tag // #swagger.responses[200] = {schema : {"QrSecret":"string", "QRcode": "string"}}
    })
}

// POST /QRcode/save
exports.save_users_qrcode = function (req, res) {
    //check inputtoken with secret and save in database
    // #swagger.tags = ['Authentication']

    /* #swagger.parameters['JWT'] = {
               in: 'header',
               description: 'Jwt verification.',
               required: true,
               type: 'string',
               name: 'Authorization',
               description: 'Bearer token'
        } */

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               description: 'User QR Code information.',
               required: true,
               type: 'object',
               schema: { "QrSecret": "string", "token": "string" }
        } */

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err) {
            return res.sendStatus(403) // #swagger.responses[403]
        }

        const secret = req.body.QrSecret.ascii;
        const inputToken = req.body.token;

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'ascii',
            token: inputToken
        });
        if (verified) {
            pool.query("UPDATE \"USER\" SET \"QrSecret\"=$1::text WHERE \"UserId\"=$2", [secret, jwtPayload.id],
                (error, response) => {
                    const userCopy = {
                        id: jwtPayload.id,
                        email: jwtPayload.email,
                        roleId: jwtPayload.roleId,
                        groupId: jwtPayload.groupId
                    };
                    const newAccessToken = jwt.sign(userCopy, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
                    res.send({ accessToken: newAccessToken }) // #swagger.responses[200] = {schema : {"accessToken": "string"}}
                });
        } else {
            res.status(400).json({ message: "Invalid code" }) // #swagger.responses[400] = { schema: {message: "Invalid code"}}
        }
    })
}

// GET /QRcode/verify
exports.verify_authenticator_2fa = function (req, res) {
    // #swagger.tags = ['Authentication']

    /* #swagger.parameters['JWT'] = {
               in: 'header',
               description: 'Jwt verification.',
               required: true,
               type: 'string',
               name: 'Authorization',
               description: 'Bearer token'
        } */

    /* #swagger.parameters['userInfo'] = {
           in: 'body',
           description: 'User QR Code information.',
           required: true,
           type: 'object',
           schema: {  "token": "string" }
    } */

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err || !jwtPayload.needTwoFA) {
            return res.sendStatus(403)
        } else {
            const userId = jwtPayload.userId;

            pool.query("SELECT * FROM \"USER\" WHERE \"UserId\"=$1", [userId]).then(dbResponse => {
                const user = dbResponse.rows[0];
                const usersQrSecret = user.QrSecret;
                const inputToken = req.body.token

                const verified = speakeasy.totp.verify({
                    secret: usersQrSecret,
                    encoding: 'ascii',
                    token: inputToken
                });
                if (verified) {
                    JWTResponseWithUser(user, res);
                } else {
                    res.status(400).json({ message: "Invalid code" }) // #swagger.responses[400] = { schema: {message: "Invalid code"}}
                }

            }, err => {
                res.status(401).json({ message: "User does not exist" }) // #swagger.responses[401] = { schema: {message: "User does not exist"}}
            }).catch(err => {
                res.status(401).json({ message: "User does not exist" })
            });
        }
    })
}

function JWTResponseWithUser(found, res) {
    const user = { id: found.UserId, email: found.Email, roleId: found.RoleId }

    pool.query("SELECT * FROM \"USER_GROUP\" WHERE \"UserId\"=$1", [found.UserId]).then(dbResponse2 => {
        user.groupId = dbResponse2.rows[0].GroupId;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' })
        res.status(200).json({ accessToken: accessToken })
    },
        err => {
            res.status(400).json({ message: "Error while trying to get user's group" }) // #swagger.responses[400] = { schema: {message: "Error while trying to get user's group"}}
        }
    ).catch(err => {
        user.groupId = null;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' })
        res.status(200).json({ accessToken: accessToken }) // #swagger.responses[200] = { schema: {accessToken: "string"}}
    });
}
