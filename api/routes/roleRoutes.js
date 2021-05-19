'use strict'

module.exports = function (app) {
    var auth = require('../controllers/roleController')

    app.route('/Roles/GetAll')
        .get(auth.get_all_roles)
}
