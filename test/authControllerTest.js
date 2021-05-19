let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let should = chai.should();
let request = require("request");
let app = require('../grupa6Servis');

chai.use(chaiHttp);

describe('authController', () => {

    it('verify_authenticator_2fa should have status 401, token is null', (done) => {

        chai.request(app)
            .post('/QRcode/verify')
            .end((err1, res1) => {
                res1.should.have.status(401);
                done();
            });

    })

    it('verify_authenticator_2fa should have status 401, User does not exist', (done) => {
        //login to get token
        let loginInfo = {
            email: "idedeic1@etf.unsa.ba",
            password: "sifra123"
        }

        chai.request(app)
        .post('/login')
        .send(loginInfo)
        .end((err, res) => {
            res.should.have.status(401);
            res.body.should.have.property('message');
            assert.equal(res.body.message, 'User does not exist');
            done();
        });

    })

    it('log_the_user should return token."', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                res.should.have.status(200);
                assert.notEqual(res.body.accessToken, null);
                done();
            });
    })

    it('log_the_user should have status 400 and message : The password is incorrect', (done) => {
        let info = {
            email: "whoso@whoso.com",
            password: "sifra1234"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                res.should.have.status(400);
                assert.equal(res.body.message, 'The password is incorrect');
                done();
            });
    })

    it('log_the_user should have status 401 and message: User does not exist', (done) => {
        let info = {
            email: "whoso@whoso.com123",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                res.should.have.status(401);
                assert.equal(res.body.message, 'User does not exist');
                done();
            });
    })

    it('verify_the_user should have status 403', (done) => {
        chai.request(app)
            .get('/jwt/verify')
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
    })

    it('verify_the_user should have status 200', (done) => {
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .get('/jwt/verify')
                    .set('Authorization', 'Bearer ' + res.body.accessToken)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        done();
                    });
            });
    })
    it('authenticator _2fa should have QRcode property', (done) => {

        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        }
        chai.request(app)
            .post('/QRCode')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .get('/QRcode')
                    .end((err1, res1) => {
                        res1.body.should.have.property('QRcode');
                        assert.notEqual(res1.body.QRcode, null);
                        done();
                    })
            });
    }
    )

    it('authenticator _2fa should have QrSecret property', (done) => {

        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        }
        chai.request(app)
            .post('/QRCode')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .get('/QRcode')
                    .end((err1, res1) => {
                        res1.body.should.have.property('QrSecret');
                        assert.notEqual(res1.body.QrSecret, null);
                        done();
                    })
            });
    }
    )
    it('save_users_qrcode should have status 401, token is not defined', (done) => {

        chai.request(app)
            .post('/QRcode/save')
            .end((err1, res1) => {
                res1.should.have.status(401);
                done();
            });

    })

})
