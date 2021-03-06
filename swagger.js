const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['api/routes/authRoutes', 'api/routes/passwordResetRoutes', 'api/routes/userDetailsRoutes', 'api/routes/roleRoutes', 'api/routes/userCrudRoutes']

const doc = {
    info: {
        version: "1.0.0",
        title: "Grupa 6 - API",
        description: "Documentation automatically generated by the <b>swagger-autogen</b> module."
    },
    host: "https://si-2021.167.99.244.168.nip.io:3333",
    //host: "localhost:3333",
    basePath: "/",
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        {
            "name": "Authentication",
            "description": "Endpoints for user authentication"
        },
        {
            "name": "Password reset",
            "description": "Endpoints for resetting the password"
        },
        {
            "name": "User details",
            "description": "Endpoints for getting and setting user information"
        },
        {
            "name": "User roles",
            "description": "Endpoints for getting and setting user roles"
        },
        {
            "name": "User CRUD",
            "description": "Endpoints for user CRUD"
        }
    ]
    
}

swaggerAutogen(outputFile, endpointsFiles, doc)
