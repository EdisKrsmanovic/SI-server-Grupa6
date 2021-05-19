let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let should = chai.should();
let request = require("request");
let app = require('../grupa6Servis');

chai.use(chaiHttp);

describe('userCrudController', () => {
    it('create_new_user should return status 200 and create new user afazlagic1 in database"', (done) => {
        let bodyInfo = {
            "name": "anesa",
            "lastname": "fazlagic",
            "email": "afazlagic1@etf.unsa.ba",
            "phone": "111222333",
            "password": "0000",
            "roleId": "2",
            "groupId": "1"
        };

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
                    .delete('/User/Delete/Email')
                    .set({ "authorization": `Bearer ${res.body.accessToken}` })
                    .query({ email: 'afazlagic1@etf.unsa.ba' })
                    .end((err1, res1) => {
                        chai.request(app)
                            .post('/User/CreateNew')
                            .set({ "authorization": `Bearer ${res1.body.newAccessToken}` })
                            .send(bodyInfo)
                            .end((err1, res2) => {
                                res2.should.have.status(200);
                                res2.body.should.have.property('message');
                                assert.equal(res2.body.message, 'Successfully created a new user.');
                                done();
                            });
                    });
            });
    });

    it('create_new_user should return status 500 - user exists', (done) => {
        let bodyInfo = {
            "name": "w",
            "lastname": "w",
            "email": "whoso@whoso.com",
            "phone": "1112122333",
            "password": "w",
            "roleId": "2",
            "groupId": "1"
        };

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
                    .post('/User/CreateNew')
                    .set({ "authorization": `Bearer ${res.body.accessToken}` })
                    .send(bodyInfo)
                    .end((err1, res2) => {
                        res2.should.have.status(500);
                        res2.body.should.have.property('message');
                        assert.equal(res2.body.message, 'Error while trying to insert user into database. Reason: Key (\"Email\")=(whoso@whoso.com) already exists.');
                        done();
                    });
            });
    })

    it('update_user should return status 200 and message : "Successfully updated user."', (done) => {
        let bodyInfo = {
            "userId": 1,
            "name": "Whoso",
            "lastname": "Whosić",
            "email": "whoso@whoso.com",
            "phone": "+38762322343",
            "password": "sifra123",
            "roleId": "2",
            "groupId": "1"
        };

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
                    .put('/User/Update')
                    .set({ "authorization": `Bearer ${res.body.accessToken}` })
                    .send(bodyInfo)
                    .end((err1, res2) => {
                        res2.should.have.status(200);
                        res2.body.should.have.property('message');
                        assert.equal(res2.body.message, 'Successfully updated user.');
                        done();
                    });
            });
    })
    it('get_user should return status 200 and user Whoso', (done) => {
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .get('/User/Get')
                    .set('Authorization','Bearer '+res.body.accessToken)
                    .query({userId:1})
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        assert.equal(res1.body.user.Name,'Whoso')
                        done();
                    });
            });
    })

    it('get_user should return status 401', (done) => {

        chai.request(app)
            .get('/User/Get')
            .query({userId:1})
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
    })

    it('get_all_users should return status 200 and there should be more than 0 users', (done) => {
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .get('/User/GetAll')
                    .set('Authorization','Bearer '+res.body.accessToken)
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        assert.notEqual(res1.body.users.length,0)
                        done();
                    });
            });
    })

    it('get_all_users should return status 401', (done) => {
        chai.request(app)
            .get('/User/GetAll')
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
    })


    it('delete_user shoud have status 200 and message  "Successfully deleted user!"', (done) => {

        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        let newUser = {
            "name": "osoba10",
            "lastname": "prezime",
            "email": "prezime@etf.unsa.ba",
            "phone": "061111111",
            "password": "string",
            "roleId": "2",
            "groupId": "5"
        };
        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .post('/User/CreateNew')
                    .set({"authorization": `Bearer ${res.body.accessToken}` })
                    .send(newUser)
                    .end((err1, res1) => {
                        console.log("prviii");
                        console.log(res1.body);
                        chai.request(app)
                            .delete('/User/Delete')
                            .set('Authorization','Bearer '+res.body.accessToken)
                            .query({userId:res1.body.userId})
                            .end((err2, res2) => {
                                res1.should.have.status(200);
                                res2.should.have.status(200);
                                res2.body.should.have.property('message');
                                res2.body.should.have.property('newAccessToken');
                                assert.equal(res1.body.message, "Successfully created a new user.");
                                assert.equal(res2.body.message, "Successfully deleted user!");
                                done();
                            });


                    });
            });
    });


    it('delete_user shoud have status 204 if user id not found', (done) => {

        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };

        let id={ userId : "5" };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                chai.request(app)
                    .delete('/User/Delete')
                    .set('Authorization','Bearer '+res.body.accessToken)
                    .query({userId:4})
                    .end((err2, res2) => {
                        res2.should.have.status(204);
                        done();

                    });
            });
    });



    it('setRole should return status 200 and "Successfully assigned user role"', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let role = {
            userId: "6",
            roleId: "2"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .post('/User/SetRole')
                    .send(role)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Successfully assigned user role");
                        done();
                    })
            });
    })

    it('setRole should return statut 204 if id not exist', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        //user does not exist
        let role = {
            userId: "15",
            roleId: "2"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .post('/User/SetRole')
                    .send(role)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(204);
                        done();
                    })
            });
    })
    it('set_users_group should return status 200 and "Successfully changed users group."', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        let role = {
            groupId: "1",
            userId: "6"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .post('/User/SetGroup')
                    .send(role)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(200);
                        res1.body.should.have.property('message');
                        assert.equal(res1.body.message, "Successfully changed user's group.");
                        done();
                    })
            });
    })

    it('set_users_group should return statut 204 if id not exist', (done) => {
        //login to get token
        let info = {
            email: "whoso@whoso.com",
            password: "sifra123"
        };
        //user does not exist
        let role = {
            groupId: "2",
            userId: "50"
        };

        chai.request(app)
            .post('/login')
            .send(info)
            .end((err, res) => {
                let token =res.body.accessToken
                chai.request(app)
                    .post('/User/SetGroup')
                    .send(role)
                    .set({ "authorization": `Bearer ${token}` })
                    .end((err1, res1) => {
                        res1.should.have.status(204);
                        done();
                    })
            });
    })

})
