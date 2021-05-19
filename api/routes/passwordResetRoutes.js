'use strict'

module.exports = function (app) {
    var auth = require('../controllers/passwordResetController')

    app.route('/forgotPassword')
        .put(auth.send_forgot_password_email)

    app.route('/changePassword/:token')
        .put(auth.change_password)

    app.route('/answerCheck')
        .post(auth.check_answers)

    app.route('/AllSecurityQuestions')
        .get(auth.get_all_security_questions)

    app.route('/User/AllQuestions')
        .post(auth.get_all_questions_for_user)

    app.route('/setSecurityQuestionsAndAnswers')
        .post(auth.save_users_security_questions)
};
