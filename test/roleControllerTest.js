let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let should = chai.should();
let request = require("request");
let app = require('../grupa6Servis');

chai.use(chaiHttp);

describe('roleControllerTest', () => {

    // it('get_all_roles should have status 401, token is null', (done) => {
    //
    //     chai.request(app)
    //         .put('/Roles' + "/GetAll/")
    //         .end((err1, res1) => {
    //             res1.should.have.status(401);
    //             done();
    //         });
    //
    // })
    //
    // it('get_all_roles should have status 200', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "whoso@whoso.com",
    //         password: "sifra123"
    //     }
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/Roles/GetAll')
    //             .end((err1, res1) => {
    //                 res1.should.have.status(200);
    //                 res1.body.should.have.property('roles');
    //                 assert.notEqual(res1.body.roles, null);
    //                 res1.body.should.have.property('newAccessToken');
    //                 assert.notEqual(res1.body.newAccessToken, null);
    //                 done();
    //             })
    //     });
    //
    // })
    //
    // it('get_all_roles should have status 403, user is not SuperAdmin', (done) => {
    //     //login to get token
    //     let loginInfo = {
    //         email: "idedeic1@etf.unsa.ba",
    //         password: "sifra123"
    //     }
    //
    //     chai.request(app)
    //     .post('/login')
    //     .send(loginInfo)
    //     .end((err, res) => {
    //         chai.request(app)
    //             .post('/Roles/GetAll')
    //             .end((err1, res1) => {
    //                 res1.should.have.status(403);
    //                 res1.body.should.have.property('message');
    //                 assert.equal(res1.body.message, 'User does not have a SuperAdmin role!');
    //                 done();
    //             })
    //     });
    //
    // })


})
