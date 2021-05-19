require('dotenv').config()
'use strict'
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const pg = require('pg');
const pool = new pg.Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    }
);

function generateNewJWT(jwtPayload) {
    delete jwtPayload.iat;
    delete jwtPayload.exp;
    return jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'})
}

exports.get_all_roles = function (req, res) {
    // #swagger.tags = ['User roles']
    // #swagger.description = 'Endpoint for getting all roles'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401)  // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403)
        }
        pool.query("SELECT * FROM \"USER\" WHERE \"UserId\"=$1", [user.id]).then(dbResponse => {
            const databaseUser = dbResponse.rows[0];

            pool.query("SELECT \"RoleId\" FROM \"ROLE\" WHERE \"Name\" = $1::text", ['SuperAdmin']).then(dbres => {
                const superAdminId = dbres.rows[0].RoleId;

                if (databaseUser.RoleId !== superAdminId)
                    return res.status(403).json({ message: "User does not have a SuperAdmin role!" }); // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }

                pool.query("SELECT * FROM \"ROLE\"").then(dbResponse => {
                    let roles = dbResponse.rows;
                    const newAccessToken = generateNewJWT(user);
                    res.status(200).json({roles, newAccessToken}); // #swagger.responses[200] = { schema: [{"RoleId": 1, "Name": "SuperAdmin"},{"RoleId": 2, "Name": "MonitorSuperAdmin"}] }
                }, err1 => {
                    res.status(500).json({ message: "Error while trying to get roles" }); // #swagger.responses[400] = { schema: {"message": "Error while trying to get roles."} }
                }).catch(err1 => {
                    res.status(500).json({ message: "Error while trying to get roles" });
                });
            }, err => {
                res.status(500).json({ message: "Role does not exist" })
            }).catch(err => {
                res.status(500).json({ message: "Role does not exist" })
            });
        }, err => {
            res.status(500).json({ message: "User does not exist" })
        }).catch(err => {
            res.status(500).json({ message: "User does not exist" })
        });
    });
}
