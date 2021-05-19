'use strict'

module.exports = function (app) {
    var auth = require('../controllers/userDetailsController')

    app.route('/newPhoneNumber')
        .put(auth.send_verification_sms)

    app.route('/phone-confirmation/:token')
        .get(auth.change_phone_number)

    app.route('/checkPassword')
        .post(auth.check_password)

    app.route('/checkIfEmailExists')
        .post(auth.check_if_email_exists)

    app.route('/checkIfEmailVerified')
        .post(auth.check_if_email_verified)

    app.route('/sendVerificationEmail')
        .put(auth.send_verification_email)

    app.route('/verifyEmail/:token')
        .put(auth.verify_email)

    app.route('/getUserDetails')
        .get(auth.get_user_detals)

    app.route('/setUserDetails')
        .post(auth.set_user_details)
};
