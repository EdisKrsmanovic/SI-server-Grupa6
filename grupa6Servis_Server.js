const express = require('express')
const https = require("https"),
    fs = require("fs");
const cors = require('cors')

app = express()
port = process.env.PORT || 3333
bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerFile))

const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/si-2021.167.99.244.168.nip.io/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/si-2021.167.99.244.168.nip.io/fullchain.pem")
};
https.createServer(options, app).listen(port);

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
