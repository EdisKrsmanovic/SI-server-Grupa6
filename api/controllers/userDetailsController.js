require('dotenv').config()
'use strict'
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const pg = require('pg');
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}
);
const mailgun = require("mailgun-js");
const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.DOMAIN,
    host: process.env.MAILGUN_HOST,
    url: process.env.MAILGUN_URL
});
const twilio = require('twilio');
const request = require("request");
const requestHeaders = {
    "Content-Type": "application/json",
    "apikey": process.env.REBRANDLY_API_KEY
}

exports.send_verification_sms = function (req, res) {
    // #swagger.tags = ['User details']

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
           required: true,
           type: 'object',
           schema: {"phone": "string"}
    } */
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401)  // #swagger.responses[401] 
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err) {
            return res.sendStatus(403)  // #swagger.responses[403] 
        }
        pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1::text", [jwtPayload.email]).then(dbResponse => {
            const found = dbResponse.rows[0];
            const user = { UserId: found.UserId, Phone: req.body.phone }
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const client = new twilio(accountSid, authToken);
            const uriLong = 'https://si-2021.167.99.244.168.nip.io:3333/phone-confirmation/' + accessToken;
            let linkRequest = {
                destination: uriLong,
                domain: { fullName: "rebrand.ly" }
            };
            request({
                uri: "https://api.rebrandly.com/v1/links",
                method: "POST",
                body: JSON.stringify(linkRequest),
                headers: requestHeaders
            }, (err, response, body) => {
                let link = JSON.parse(body);
                const poruka = `Tap on this link to verify your phone number:\nhttps://www.${link.shortUrl}`;
                client.messages
                    .create({
                        body: poruka,
                        from: 'MONITOR',
                        to: req.body.phone
                    })
                    .then(message => console.log(message.sid))
                    .catch(err => {
                        console.log(err)
                    });


                res.status(200).json({ message: "Successfully sent. Confirm the number change within the next 10 minutes." })  // #swagger.responses[200] = { schema : { "message": "Successfully sent. Confirm the number change within the next 10 minutes."}}
            });

        },
            err => {
                res.status(400).json({ message: "Error while trying to find user with requested email." })   // #swagger.responses[400] = { schema : { "message": "Error while trying to find user with requested email."}}
            }
        ).catch(err => {
            console.log(err);
            res.status(400).json({ message: "Incorrect email!" })   // #swagger.responses[400] = { schema : { "message": "Incorrect email."}}
        });
    });
}

//the following method is called when the user clicks on the confirmation link received in the sms - might be changed
exports.change_phone_number = function (req, res) {
    const token = req.params.token;
    // #swagger.tags = ['User details']

    /* #swagger.parameters['temporaryToken'] = {
               in: 'path',
               required: true,
               type: 'string',
               name: 'token'
        } */
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403)  // #swagger.responses[403] 
        }
        pool.query("UPDATE \"USER\" SET \"Phone\"=$1 WHERE \"UserId\"=$2", [user.Phone, user.UserId]).then(dbResponse => {
            res.end(`
                <h1>Successfully changed and verified phone number.</h1>
                <script>
                  setTimeout(function () {
                     window.location = "https://monitor-dashboard.herokuapp.com/";
                  }, 3000)
                </script>`
            );
        }, err1 => {
            res.status(400).json({ message: "Error while trying to update user's phone number" });  // #swagger.responses[400] = { schema : { "message": "Error while trying to update user's phone number."}}
        }).catch(err1 => {
            res.status(400).json({ message: "Error while trying to update user's phone number" });
        });

    })
}

exports.check_password = function (req, res) {
    // #swagger.tags = ['User details']
    const passwordToCheck = req.body.password;

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
           required: true,
           type: 'object',
           schema: {"password": "string"}
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
        pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1::text", [jwtPayload.email]).then(dbResponse => {
            const userFromDB = dbResponse.rows[0];

            bcrypt.compare(passwordToCheck, userFromDB.Password, function (req1, res1) {
                if (res1) {
                    const user = { UserId: userFromDB.UserId, Email: userFromDB.Email };
                    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
                    res.status(200).json({ token: accessToken }) // #swagger.responses[200] = { schema : { "token": "string"}}
                } else {
                    res.status(400).json({ message: "The password is incorrect" }) // #swagger.responses[400] = { schema : {"message": "The password is incorrect"}}
                }
            });
        });
    });
}

exports.check_if_email_exists = function (req, res) {
    // #swagger.tags = ['User details']
    const email = req.body.email;
    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: {"email": "string"}
        } */
    pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [email]).then(dbResponse => {
        const found = dbResponse.rows[0];
        //const user = {UserId: found.UserId, Email: found.Email}
        if (found == null)
            res.status(200).json({ exists: false }); // #swagger.responses[200] = {schema : { "exists": "true"}}
        else
            res.status(200).json({ exists: true });
    },
        err => {
            res.status(400).json({ message: "Error while trying to get user's email" }) // #swagger.responses[400] = { schema : {"message": "Error while trying to get user's email"}}
        }
    ).catch(err => {
        res.status(400).json({ exists: false }); // #swagger.responses[400] = { schema : {"exists":"false"}}
    });
}

exports.check_if_email_verified = function (req, res) {
    // #swagger.tags = ['User details']
    const email = req.body.email;
    /* #swagger.parameters['userInfo'] = {
                   in: 'body',
                   required: true,
                   type: 'object',
                   schema: {"email": "string"}
            } */
    pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [email]).then(dbResponse => {
        const found = dbResponse.rows[0];
        if (found === undefined)
            res.status(400).json({ message: "Email doesn't exist" }); // #swagger.responses[400] = { schema : { "message": "Email doesn't exist"}}
        else if (found.EmailVerified == null || found.EmailVerified == false) {
            res.status(200).json({ verified: false }); // #swagger.response[200] = {schema : {"verified": "bool"}}
        } else {
            res.status(200).json({ verified: true });
        }
    },
        err => {
            res.status(400).json({ message: "Error while trying to get user's email" })
        }
    ).catch(err => {
        res.status(400).json({ message: "Error while trying to get user's email" });
    });
}


exports.send_verification_email = function (req, res) {
    // #swagger.tags = ['User details']
    const email = req.body.email;
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
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
           required: true,
           type: 'object',
           schema: {"email": "string"}
    } */
    pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [email]).then(dbResponse => {
        const found = dbResponse.rows[0];
        if (found == null) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err)
                    return res.sendStatus(403) // #swagger.responses[403]
                pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [user.email]).then(dbResponse => {
                    let userCopy = { UserId: user.id, Email: user.email, newEmail: null };
                    if (email != user.email)
                        userCopy.newEmail = email;
                    const newAccessToken = jwt.sign(userCopy, process.env.VERIFY_TOKEN_SECRET, { expiresIn: '24h' });
                    userCopy.accessToken = newAccessToken;
                    let data = {
                        from: 'Monitor <no-reply@si-monitor.studio>',
                        to: (email == null) ? user.email : email,
                        subject: 'Email verification',
                        template: 'confirm-email',
                        'h:X-Mailgun-Variables': JSON.stringify({
                            link_za_potvrdu: process.env.CLIENT_URL + '/verify-email/' + newAccessToken,
                        })
                    };

                    mg.messages().send(data, function (error, body) {
                        console.log(error);
                        console.log(body);
                    });
                    res.status(200).json({ message: "Successfully sent. Verify your e-mail in 24h" }) // #swagger.responses[200] = { schema : {"message": "Successfully sent. Verify your e-mail in 24h"}}

                },
                    err => {
                        res.status(400).json({ message: "Error while trying to get user's email" }) // #swagger.responses[400] = {schema: {"message": "Error while trying to get user's email"}}
                    }
                ).catch(err => {
                    console.log(err);
                    res.status(400).json({ message: "Error while trying to get user's email" });
                });


            })
        } else {
            res.status(400).json({ message: "Email already exists!" });
        }
    },
        err => {
            res.status(400).json({ message: "Error while trying to get user's email" })
        }
    ).catch(err => {
        res.status(400).json({ exists: false });
    });


}

exports.verify_email = function (req, res) {
    // #swagger.tags = ['User details']
    const token = req.params.token;
    /* #swagger.parameters['temporaryToken'] = {
                   in: 'path',
                   required: true,
                   type: 'string',
                   name: 'token'
            } */

    jwt.verify(token, process.env.VERIFY_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403) // #swagger.responses[403]
        }
        pool.query("SELECT * FROM \"USER\" WHERE \"UserId\"=$1", [user.UserId]).then(dbResponse => {
            const found = dbResponse.rows[0];
            if (found == null)
                res.status(400).json({ message: "User doesn't exists" }); // #swagger.responses[400] = { schema : { "message": "User doesn't exist"}}
            else {
                console.log(user);
                const newEmail = (user.newEmail === undefined || user.newEmail === null) ? user.Email : user.newEmail;
                pool.query("UPDATE \"USER\" SET \"Email\"=$1, \"EmailVerified\"=$2 WHERE \"UserId\"=$3", [newEmail, true, found.UserId]).then(dbResponse => {
                    res.json({ message: "Successfully verified email." }); // #swagger.responses[200] = {schema: {"message": "Successfully verified email."}}
                }, err1 => {
                    res.status(400).json({ message: "Error while trying to verify email" });
                }).catch(err1 => {
                    res.status(400).json({ message: "Error while trying to verify email" });
                });
            }
        }
            ,
            err2 => {
                res.status(400).json({ message: "Error while trying to get user" })
            }
        ).catch(err2 => {
            res.status(400).json({ message: "Error while trying to get user" });
        });

    })
}


exports.get_user_detals = function (req, res) {
    // #swagger.tags = ['User details']

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

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err || jwtPayload.needTwoFA !== undefined) {
            return res.sendStatus(403) // #swagger.responses[403]
        } else {
            const userId = jwtPayload.id;
            pool.query("SELECT * FROM \"USER\" WHERE \"UserId\"=$1", [userId]).then(dbResponse => {
                const user = dbResponse.rows[0];
                const userDetails = {
                    name: user.Name,
                    lastname: user.Lastname,
                    email: user.Email,
                    phone: user.Phone,
                    address: user.Address
                };
                res.json(userDetails); // #swagger.responses[200] = { schema : {"name": "string", "lastname" : "string", "email": "string", "phone": "string", "address": "string"}}
            }).catch(() => {
                res.status(500); // #swagger.responses[500]
                res.end();
            });
        }
    });
}

exports.set_user_details = function (req, res) {
    // #swagger.tags = ['User details']

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
          required: true,
          type: 'object',
          schema: {"name": "string", "lastname": "string", "address": "string"}
   } */
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err || jwtPayload.needTwoFA !== undefined) {
            return res.sendStatus(403) // #swagger.responses[403]
        } else {
            const userId = jwtPayload.id;
            pool.query("UPDATE \"USER\" SET \"Name\"=$1::text, \"Lastname\"=$2::text, \"Address\"=$3::text WHERE \"UserId\"=$4", [req.body.name, req.body.lastname, req.body.address, jwtPayload.id],
                (error, response) => {
                    if (error) {
                        return res.sendStatus(400); // #swagger.responses[400]
                    }
                    const userCopy = {
                        id: jwtPayload.id,
                        email: jwtPayload.email,
                        roleId: jwtPayload.roleId,
                        groupId: jwtPayload.groupId
                    };
                    const newAccessToken = jwt.sign(userCopy, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
                    res.send({ accessToken: newAccessToken }) // #swagger.responses[200] = { schema : {"accessToken": "string"}}
                });
        }
    });
}
