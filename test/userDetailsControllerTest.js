//let expect = require("chai").expect;
let chai = require('chai');
let assert = chai.assert
let chaiHttp = require('chai-http');
let should = chai.should();
let request = require("request");
let app = require('../grupa6Servis');

chai.use(chaiHttp);
describe('userDetailsController', () => {
    it('checkIfEmailExists should return "true"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "tjapalak1@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/checkIfEmailExists')
                    .send(mail)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('exists');
                        assert.equal(res1.body.exists, true);
                        done();
                    })
            });
    })

    it('checkIfEmailExists should return "false"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "email@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/checkIfEmailExists')
                    .send(mail)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('exists');
                        assert.equal(res1.body.exists, false);
                        done();
                    })
            });
    })

    it('checkIfEmailVerified should return "true"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "tjapalak1@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/checkIfEmailVerified')
                    .send(mail)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('verified');
                        assert.equal(res1.body.verified, true);
                        done();
                    })
            });
    })

    it('checkIfEmailVerified should return "Email does not exist"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "mail@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/checkIfEmailVerified')
                    .send(mail)
                    .end((err1, res1) => {
                        res1.should.have.status(400);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Email doesn't exist");
                        done();
                    })
            });
    })

    it('checkIfEmailVerified should return "false"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "khalilovic2@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/checkIfEmailVerified')
                    .send(mail)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('verified');
                        assert.equal(res1.body.verified, false);
                        done();
                    })
            });
    })

    it('sendVerificationEmail should return "Email already exists!"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "tjapalak1@etf.unsa.ba"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .put('/sendVerificationEmail')
                    .send(mail)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(400);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Email already exists!");
                        done();
                    })
            });
    })
      it('sendVerificationEmail should return "Successfully sent. Verify your e-mail in 24h"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let mail = {
            email: "tjapalak2@etf.unsa.ba"
        };
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .put('/sendVerificationEmail')
                    .send(mail)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Successfully sent. Verify your e-mail in 24h");
                        done();
                    })
            });
    })
    it('verifyEmail should return ', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .put('/verifyEmail/' + res.body.accessToken)
                    .end((err1, res1) => {
                        res1.should.have.status(403);
                        done();
                    })
            });
    })

    it('checkPassword should return status 400 and message that password is incorrect', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        let password = {
            password: "eee"
        }
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token = res.body.accessToken
                chai.request(app)
                    .post('/checkPassword')
                    .set({ "authorization": `Bearer ${token}` })
                    .send(password)
                    .end((err1, res1) => {
                        res1.should.have.status(400);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "The password is incorrect");
                        done();
                    })
            });
    })

    it('checkPassword should return status 200 and token if password is correct', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        let password = {
            password: "eeee"
        }
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token = res.body.accessToken
                chai.request(app)
                    .post('/checkPassword')
                    .set({ "authorization": `Bearer ${token}` })
                    .send(password)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('token');
                        done();
                    })
            });
    })

    it('phone-confirmation/:token should not change phone number because Phone number is not set in the token', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/phone-confirmation/' + res.body.accessToken)
                    .end((err1, res1) => {
                        res1.should.have.status(404);

                        //assert.equal(res1.body.accessToken, token);
                        done();
                    })
            });
    })

    it('setUserDetails should return status 400 and not update User details', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        let updateUser ={
            nme: "Emir",
            lastname: "Hodzic",
            address: null
        }
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token = res.body.accessToken
                chai.request(app)
                    .post('/setUserDetails')
                    .set({ "authorization": `Bearer ${token}` })
                    .send(updateUser)
                    .end((err1, res1) => {
                        res1.should.have.status(400);
                        done();
                    })
            });
    })

    it('setUserDetails should update User details', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        let updateUser ={
            name: "Emir",
            lastname: "Hodzic",
            address: null
        }
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token = res.body.accessToken
                chai.request(app)
                    .post('/setUserDetails')
                    .set({ "authorization": `Bearer ${token}` })
                    .send(updateUser)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('accessToken');
                        //assert.equal(res1.body.accessToken, token);
                        done();
                    })
            });
    })

    it('getUserDetails should return User details', (done) => {
        //login to get token
        let info = {
            email: "eh@gmail.com",
            password: "eeee"
        };
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token = res.body.accessToken
                chai.request(app)
                    .get('/getUserDetails')
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('name');
                        res1.body.should.have.property('lastname');
                        res1.body.should.have.property('email');
                        res1.body.should.have.property('phone');
                        res1.body.should.have.property('address');
                        assert.equal(res1.body.name, "Emir");
                        assert.equal(res1.body.lastname, "Hodzic");
                        assert.equal(res1.body.email, "eh@gmail.com");
                        assert.equal(res1.body.phone, "061162384");
                        assert.equal(res1.body.address, null);
                        done();
                    })
            });
    })

    it('getUserDetails should return status 401, User is not found', (done) => {
        //login to get token
        let info = {
            email: "nonExistingMail@whoso.com",
            password: "nonExistingsifra123"
        };
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.have.property('message');
                assert.equal(res.body.message, "User does not exist");
                done();
            });
    })


    it('sendVerificationSms should return status 200 and "Successfully sent. Confirm the number change within the next 10 minutes."', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let number = {
            phone: "+38761832943"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .put('/newPhoneNumber')
                    .send(number)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Successfully sent. Confirm the number change within the next 10 minutes.");
                        done();
                    })
            });
    })
    it('sendVerificationEmail should have status 401 if token is not corect', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let number = {
            phone: "+38762322343"
        };
        chai.request(app)
            .put('/newPhoneNumber')
            .send(number)
            .set({ "authorization": '7htfsgn5' })
            .end((err1, res1) => {
                res1.should.have.status(401);
                done();
            })
    });
})
