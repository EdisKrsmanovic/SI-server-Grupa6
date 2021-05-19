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
const format = require('pg-format');

exports.send_forgot_password_email = function (req, res) {
    // #swagger.tags = ['Password reset']

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { "email": "string"}
        } */
    pool.query("SELECT * FROM \"USER\" WHERE \"Email\"=$1", [req.body.email]).then(dbResponse => {
        const found = dbResponse.rows[0];
        const user = { UserId: found.UserId, Email: found.Email }
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
        const data = {
            from: 'Monitor <no-reply@si-monitor.studio>',
            to: found.Email,
            subject: 'Reset your password',
            template: 'reset-password',
            'h:X-Mailgun-Variables': JSON.stringify({
                link_za_reset: process.env.CLIENT_URL + '/password-reset/' + accessToken,
            })
        };
        mg.messages().send(data, function (error, body) {
            console.log(error);
            console.log(body);
        });


        res.status(200).json({ message: "Successfully sent. Change the password within 10 minutes" }) // #swagger.responses[200] = { schema: {"message": "Successfully sent. Change the password within 10 minutes"} }
    },
        err => {
            res.status(400).json({ message: "Error while trying to get user's email" }) // #swagger.responses[400] = { schema: {"message": "Error while trying to get user's email"} } 
        }
    ).catch(err => {
        res.status(400).json({ message: "Error while trying to get user's email. Incorrect email!" }) // #swagger.responses[400] = { schema: {"message": "Error while trying to get user's email. Incorrect email!"} }
    });
}


exports.change_password = function (req, res) {
    // #swagger.tags = ['Password reset']

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { "password": "string"}
        } */
    /* #swagger.parameters['temporaryToken'] = {
           in: 'path',
           required: true,
           type: 'string',
           name: 'token'
    } */
    const token = req.params.token;
    let newPW = req.body.password;

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403) // #swagger.responses[403] 
        }
        bcrypt.hash(newPW, 12, function (err1, hash) {
            if (err1) return res.sendStatus(401); // #swagger.responses[401]
            pool.query("UPDATE \"USER\" SET \"Password\"=$1 WHERE \"UserId\"=$2", [hash, user.UserId]).then(dbResponse => {
                res.json({ message: "Successfully changed password." }); // #swagger.responses[200] = { schema: {"message": "Successfully changed password."} }
            }, err1 => {
                res.status(400).json({ message: "Error while trying to update user's password" }); // #swagger.responses[400] = { schema: {"message": "Error while trying to updates user's password."} }
            }).catch(err1 => {
                res.status(400).json({ message: "Error while trying to update user's password" });
            });
        });

    })
}

exports.check_answers = async (req, res) => {
    //body example [{ "Answer":"Gzerkses Veliki", "QuestionId":"1" }, { "Answer":"Damaskus", "QuestionId":"2" },
    //{ "Answer":"Osnovna skola osnovac", "QuestionId":"3" }, { "Answer":"Veliki decko", "QuestionId":"4" },
    //{ "Answer":"Djecija ulica", "QuestionId":"5" }]
    // #swagger.tags = ['Password reset']

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { "email": "string", answers: [{"QuestionId": "number", "Answer": "string"}]}
        } */
    const userEmail = req.body.email;
    const userAnswers = req.body.answers;

    let correctAnsw = true;

    if (req.body.length > 5 || req.body.length < 3) //should be 3 to 5 aswers
        return res.json({ correctAnswers: false });

    let validAnswers = [];
    validAnswers = userAnswers.filter(answ => {
        return answ.QuestionId !== 'null';
    });
    if (validAnswers.length > 5 || validAnswers.length < 3) //if there is more than 2 null
        return res.json({ correctAnswers: false }); // #swagger.responses[200] = { schema: {"correctAnswers": "false"} }

    pool.query("SELECT * FROM \"USER_SECURITY_QUESTION\" WHERE \"UserId\"=(SELECT \"UserId\" FROM \"USER\" WHERE \"Email\" = $1::text)", [userEmail]).then(dbResponse => {
        const databaseUser = dbResponse.rows;

        for (const userBaseQuestion of databaseUser) {
            let foundUser = validAnswers.find(userQuestion => {
                return (Number(userQuestion.QuestionId) === userBaseQuestion.QuestionId);
            });
            if (!foundUser) {
                correctAnsw = false;
                break;
            }
            else if (foundUser.Answer !== userBaseQuestion.Answer) {
                correctAnsw = false;
                break;
            }
        }

        let accessToken = null;

        if (correctAnsw) {
            const user = { UserId: databaseUser[0].UserId, Email: databaseUser[0].Email }
            accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
        }

        res.json({ correctAnswers: correctAnsw, token: accessToken }); // #swagger.responses[200] = { schema: {"correctAnswers": "true", "token": "string"} }

    }, err => {
        res.status(401).json({ message: "User does not exist" }) // #swagger.responses[401] = { schema: {"message": "User does not exist"} }
    }).catch(err => {
        res.status(401).json({ message: "User does not exist" })
    });
}

exports.get_all_security_questions = function (req, res) {
    // #swagger.tags = ['Password reset']
    pool.query("SELECT * FROM \"SECURITY_QUESTION\"").then(dbResponse => {
        let questions = dbResponse.rows;
        res.status(200).json(questions); // #swagger.responses[200] = { schema: [{"QuestionId": "integer", "Question": "string"}] }
    }, err1 => {
        res.status(400).json({ message: "Error while trying to get security questions" }); // #swagger.responses[400] = { schema: {"message": "Error while trying to get security questions."} }
    }).catch(err1 => {
        res.status(400).json({ message: "Error while trying to get security questions" });
    });
}

exports.get_all_questions_for_user = function (req, res) {
    // #swagger.tags = ['Password reset']

    /* #swagger.parameters['userInfo'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { "email": "string"}
        } */
    const userEmail = req.body.email;

    pool.query("SELECT \"sq\".* FROM \"SECURITY_QUESTION\" as \"sq\",\"USER_SECURITY_QUESTION\" as \"usq\"  WHERE \"usq\".\"UserId\"=(SELECT \"UserId\" FROM \"USER\" WHERE \"Email\" = $1::text) AND \"usq\".\"QuestionId\"=\"sq\".\"QuestionId\"", [userEmail])
        .then(dbResponse => {
            res.status(200).json(dbResponse.rows); // #swagger.responses[200] = { schema: [{"QuestionId": "integer", "Question": "string"}] }
        },
            err => {
                res.status(400).json({ message: "Error while trying to get user's questions" }) // #swagger.responses[400] = { schema: {"message": "Error while trying to get security questions."} }
            }).catch(err => {
                res.status(400).json({ message: "Error while trying to get user's questions" })
            });
}

exports.save_users_security_questions = function (req, res) {
    // #swagger.tags = ['Password reset']

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
              schema: [{"QuestionId": "number", "Answer": "string"}]
       } */

    const questionsList = req.body;

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401] 
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err) {
            return res.sendStatus(403) // #swagger.responses[403] 
        }

        //must contain 3 or more questions and answers
        if (questionsList.length < 3) {
            return res.status(403).send({ message: 'Must contain between 3 and 5 questions' }) // #swagger.responses[403] = { schema: {"message": "Must contain between 3 and 5 questions"} }
        }

        //must not contain empty answers
        for (let i = 0; i < questionsList.length; i++) {
            if (questionsList[i].answer === "") {
                return res.status(403).send({ message: 'Answers must not be empty' }) // #swagger.responses[403] = { schema: {"message": "Answers must not be empty."} }
            }
        }

        //must delete old user security questions
        pool.query("DELETE FROM \"USER_SECURITY_QUESTION\" WHERE \"UserId\"=$1", [jwtPayload.id]).then(() => {

            //insert new user security questions
            let insertData = [];
            for (let i = 0; i < questionsList.length; i++) {
                const questionId = questionsList[i].questionId
                const answer = questionsList[i].answer
                insertData.push([jwtPayload.id, questionId, answer])
            }

            let insertSqlQuery = format('INSERT INTO \"USER_SECURITY_QUESTION\" VALUES %L', insertData);

            pool.query(insertSqlQuery)
                .then(() => {
                    res.json({ message: "Successfully added user's questions and answers." }); // #swagger.responses[200] = { schema: {"message": "Successfully added user's questions and answers."}}
                }, err1 => {
                    res.status(400).json({ message: "Error while trying to add user's questions and answers." }); // #swagger.responses[400] = { schema : {"message": "Error while trying to add user's questions and answers"}}
                }).catch(err1 => {
                    res.status(400).json({ message: "Error while trying to add user's questions and answers." });
                });
        });
    })
}