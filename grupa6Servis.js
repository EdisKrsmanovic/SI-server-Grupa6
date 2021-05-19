var express = require('express')
const cors = require('cors')

app = express()
port = process.env.PORT || 3333
bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerFile))

app.listen(port)

var authRoutes = require('./api/routes/authRoutes'); //importing the routes
authRoutes(app);

var passwordResetRoutes = require('./api/routes/passwordResetRoutes'); //importing the routes
passwordResetRoutes(app);

var userDetailsRoutes = require('./api/routes/userDetailsRoutes'); //importing the routes
userDetailsRoutes(app);

var roleRoutes = require('./api/routes/roleRoutes'); //importing the routes
roleRoutes(app);

var userCrudRoutes = require('./api/routes/userCrudRoutes'); //importing the routes
userCrudRoutes(app);

//app.use('/', require('./api/routes/authRoutes'));
//app.use('/', require('./api/routes/passwordResetRoutes'));
//app.use('/', require('./api/routes/userDetailsRoutes'));

module.exports = app;
