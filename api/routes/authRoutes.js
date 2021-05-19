'use strict'

module.exports = function (app) {
    var auth = require('../controllers/authController')

    // auth Routes
    app.route('/login')
        .post(auth.log_the_user)

    app.route('/jwt/verify')
        .get(auth.verify_the_user)

    app.route('/QRcode')
        .get(auth.authenticator_2fa)

    app.route('/QRcode/save')
        .post(auth.save_users_qrcode)

    app.route('/QRcode/verify')
        .post(auth.verify_authenticator_2fa)

    app.route('/HelloWorld')
        .get(auth.hello_world)

    app.route('/github_deployment')
        .post(auth.github_deployment)
};
