let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let should = chai.should();
let request = require("request");
let app = require('../grupa6Servis');

chai.use(chaiHttp);

describe('passwordResetController', () => {
    it('change_password should return "Successfully changed password."', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let pass = {
            password: "novasifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .put('/changePassword/' + res.body.accessToken)
                    .send(pass)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, 'Successfully changed password.');
                        done();
                    })
            });
    })

    it('change_password should have status 403', (done) => {
        let pass = {
            password: "novasifra123"
        };

        chai.request(app)
            .put('/changePassword/' + "neispravnasifra")
            .send(pass)
            .end((err1, res1) => {
                res1.should.have.status(403);
                done();
            });
    })

    it('check_answers should have status 200, return correctAnswers : true , token value is not null', (done) => {
        let bodyInfo = {
            "email": "kdokic1@etf.unsa.ba",
            "answers":
                [
                    {
                        "QuestionId": 1,
                        "Answer": "a"
                    },
                    {
                        "QuestionId": 2,
                        "Answer": "b"
                    },
                    {
                        "QuestionId": 3,
                        "Answer": "c"
                    }
                ]
        };
        chai.request(app)
            .post('/answerCheck')
            .send(bodyInfo)
            .end((err1, res1) => {
                res1.should.have.status(200);
                res1.body.should.have.property('correctAnswers');
                res1.body.should.have.property('token');
                res1.body.correctAnswers.should.equal(true);
                assert.notEqual(res1.body.token, null);
                done();
            });
    })

    it('check_answers should fail because the number of provided answers in the body is less than 3', (done) => {
        let bodyInfo = {
            "email": "kdokic1@etf.unsa.ba",
            "answers":
                [
                    {
                        "QuestionId": 1,
                        "Answer": "a"
                    }
                ]
        };
        chai.request(app)
            .post('/answerCheck')
            .send(bodyInfo)
            .end((err1, res1) => {
                res1.body.should.have.property('correctAnswers');
                res1.body.correctAnswers.should.equal(false);
                done();
            });
    })

    it('check_answers should fail because there are Answers with incorrect values', (done) => {
        let bodyInfo = {
            "email": "kdokic1@etf.unsa.ba",
            "answers":
                [
                    {
                        "QuestionId": 1,
                        "Answer": "netacan odgovor"
                    },
                    {
                        "QuestionId": null,
                        "Answer": "netacan odgovor"
                    },
                    {
                        "QuestionId": null,
                        "Answer": "netecan odgovor"
                    }
                ]
        };
        chai.request(app)
            .post('/answerCheck')
            .send(bodyInfo)
            .end((err1, res1) => {
                res1.body.should.have.property('correctAnswers');
                res1.body.correctAnswers.should.equal(false);
                done();
            });
    })

    it('check_answers should return "User does not exist"', (done) => {
        let bodyInfo = {
            "email": "null",
            "answers":
                [
                    {
                        "QuestionId": 1,
                        "Answer": "a"
                    },
                    {
                        "QuestionId": 2,
                        "Answer": "b"
                    },
                    {
                        "QuestionId": 3,
                        "Answer": "c"
                    }
                ]
        };
        chai.request(app)
            .post('/answerCheck')
            .send(bodyInfo)
            .end((err1, res1) => {
                res1.should.have.status(401);
                res1.body.should.have.property('message');
                res1.body.message.should.equal('User does not exist');
                done();
            });
    })

    // it('send_forgot_password_email should have status 400, incorrect email', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let email = {
    //         email: "test123"
    //     }
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/forgotPassword')
    //             .send(email)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(400);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Error while trying to get user'+ "'" + 's email. Incorrect email!');
    //                 done();
    //             })
    //     });
    // })
    //
    // it('send_forgot_password_email should have status 400', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let email = {
    //         email: "pogresanmail@bih.net.ba."
    //     }
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/forgotPassword')
    //             .send(email)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(400);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Error while trying to get user' + "'" + 's email. Incorrect email!');
    //                 done();
    //             })
    //     });
    // })
    //
    // it('send_forgot_password_email should have status 200', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let email = {
    //         email: "idedeic1@etf.unsa.ba"
    //     }
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/forgotPassword')
    //             .send(email)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(200);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Successfully sent. Change the password within 10 minutes');
    //                 done();
    //             })
    //     });
    // })
    //
    // it('save_users_security_questions should have status 403, should fail because the number of provided answers in the body is less than 3', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let bodyInfo = {
    //         "email": "whoso@whoso.com",
    //         "answers":
    //             [
    //                 {
    //                     "QuestionId": 1,
    //                     "Answer": "abc"
    //                 },
    //                 {
    //                     "QuestionId": 2,
    //                     "Answer": "bca"
    //                 }
    //             ]
    //     };
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/setSecurityQuestionsAndAnswers')
    //             .send(bodyInfo)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(403);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Successfully changed password.');
    //                 done();
    //             })
    //     });
    // })
    //
    // it('save_users_security_questions should have status 403, should fail because one answer is empty', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let bodyInfo = {
    //         "email": "whoso@whoso.com",
    //         "answers":
    //             [
    //                 {
    //                     "QuestionId": 1,
    //                     "Answer": "abc"
    //                 },
    //                 {
    //                     "QuestionId": 2,
    //                     "Answer": "cba"
    //                 },
    //                 {
    //                     "QuestionId": 3,
    //                     "Answer": ""
    //                 }
    //             ]
    //     };
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/setSecurityQuestionsAndAnswers')
    //             .send(bodyInfo)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(403);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Answers must not be empty');
    //                 done();
    //             })
    //     });
    // })
    //
    // it('save_users_security_questions should have status 200', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     let bodyInfo = {
    //         "email": "whoso@whoso.com",
    //         "answers":
    //             [
    //                 {
    //                     "QuestionId": 1,
    //                     "Answer": "abc"
    //                 },
    //                 {
    //                     "QuestionId": 2,
    //                     "Answer": "cba"
    //                 },
    //                 {
    //                     "QuestionId": 3,
    //                     "Answer": "bca"
    //                 },
    //                 {
    //                     "QuestionId": 4,
    //                     "Answer": "bac"
    //                 },
    //                 {
    //                     "QuestionId": 5,
    //                     "Answer": "cab"
    //                 }
    //             ]
    //     };
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/setSecurityQuestionsAndAnswers')
    //             .send(bodyInfo)
    //             .end((err1, res1) => {
    //                 res1.should.have.status(200);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'Successfully added user' + " ' "  + 's questions and answers.');
    //                 done();
    //             })
    //     });
    // })


    it('get_all_security_questions should return questions', (done) => {

        chai.request(app)
            .get('/AllSecurityQuestions')
            .end((err1, res1) => {
                assert.notEqual(res1.body, null);
                done();
            })


    })

    it('get_all_questions_for_user should return questions for user', (done) => {

        chai.request(app)
            .post('/User/AllQuestions')
            .send({ email: "whoso@whoso.com" })
            .end((err1, res1) => {
                assert.notEqual(res1.body, null);
                done();
            })

    })

})
