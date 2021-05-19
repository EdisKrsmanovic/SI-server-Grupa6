'use strict'

module.exports = function (app) {
    var auth = require('../controllers/userCrudController')

    app.route('/User/CreateNew')
        .post(auth.create_new_user);

    app.route('/User/Get')
        .get(auth.get_user);

    app.route('/User/Update')
        .put(auth.update_user);

    app.route('/User/Delete')
        .delete(auth.delete_user);

    app.route('/User/GetAll')
        .get(auth.get_all_users)

    app.route('/User/SetRole')
        .post(auth.set_role)

    app.route('/User/SetGroup')
        .post(auth.set_users_group)

    app.route('/User/Delete/Email')
        .delete(auth.delete_user_by_email)
}
