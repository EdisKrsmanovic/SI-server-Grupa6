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
    return jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' })
}

function verify_user(req, res, callback) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401) // #swagger.responses[401]
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, jwtPayload) => {
        if (err) {
            return res.sendStatus(403) // #swagger.responses[403]
        } else {
            pool.query("SELECT \"Name\" FROM \"ROLE\" WHERE \"RoleId\" = (SELECT \"RoleId\" FROM \"USER\" WHERE \"UserId\" = $1)", [jwtPayload.id])
                .then(dbResponse => {
                    const roleName = dbResponse.rows[0].Name;
                    if (roleName !== "SuperAdmin" && roleName !== "MonitorSuperAdmin") {
                        res.status(403).json({ message: "User does not have a MonitorSuperAdmin/SuperAdmin role!" }); // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
                    } else {
                        const newAccessToken = generateNewJWT(jwtPayload);
                        callback(req.body, newAccessToken);
                    }
                }, error => {
                    res.status(500).json({ message: "Error while trying to check user's role. Reason: " + error.detail });
                })
                .catch(error => {
                    res.status(500).json({ message: "Error while trying to check user's role. Reason: " + error.detail });
                })
        }
    });
}


exports.create_new_user = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for creating a new user'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['User'] = {
          in: 'body',
          required: true,
          type: 'object',
          schema: {"name": "string", "lastname": "string", "email": "string", "phone": "string", "password": "string", "roleId": "number", "groupId": "number"}
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (user, newAccessToken) => {
        bcrypt.hash(user.password, 12, function (err1, hashedPassword) {
            if (err1) return res.sendStatus(401); // #swagger.responses[401]
            pool
                .query(
                    "INSERT INTO \"USER\"(\"UserId\", \"Name\", \"Lastname\", \"Email\", \"Phone\", \"RoleId\", \"Password\") " +
                    "VALUES ((SELECT MAX(\"UserId\") + 1 FROM \"USER\"), $1::text, $2::text, $3::text, $4::text, $5, $6::text) RETURNING \"UserId\"",
                    [user.name, user.lastname, user.email, user.phone, user.roleId, hashedPassword]
                )
                .then(dbResponse => {
                    const userId = dbResponse.rows[0].UserId;
                    pool
                        .query(
                            "INSERT INTO \"USER_GROUP\"(\"UserId\", \"GroupId\", \"Id\") " +
                            "VALUES ($1, $2, (SELECT MAX(\"Id\") + 1 FROM \"USER_GROUP\"))", [userId, user.groupId])
                        .then(dbResponse2 => {
                            res.json({ message: "Successfully created a new user.", userId, newAccessToken }); // #swagger.responses[200] = { schema: {"message": "Successfully created a new user.", "userId": "number", "newAccessToken": "string" } }
                        }, error => {
                            res.status(500).json({ message: "Error while trying to set user's group" });
                        })
                        .catch(error => {
                            res.status(500).json({ message: "Error while trying to set user's group" });
                        })
                }, err1 => {
                    res.status(500).json({ message: "Error while trying to insert user into database. Reason: " + err1.detail }); // #swagger.responses[500] = { schema: {"message": "Error while trying to insert user into database. Reason: "} }
                })
                .catch(err1 => {
                    res.status(500).json({ message: "Error while trying to insert user into database. Reason: " + err1.detail });
                });
        });
    });
}

exports.get_user = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for getting user\'s info'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['userId'] = {
          in: 'query',
          required: true,
          type: 'integer'
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (body, newAccessToken) => {
        const userId = req.query.userId;
        if (userId) {
            pool
                .query(
                    "SELECT u.\"UserId\", u.\"Name\", u.\"Lastname\", u.\"Email\", u.\"Phone\", u.\"RoleId\", ug.\"GroupId\" " +
                    "FROM \"USER\" u " +
                    "JOIN \"USER_GROUP\" ug ON u.\"UserId\" = ug.\"UserId\" " +
                    "WHERE u.\"UserId\"=$1", [userId])
                .then(dbResponse => {
                    if (dbResponse.rowCount > 0) {
                        const user = dbResponse.rows[0];
                        res.json({ user, newAccessToken }); // #swagger.responses[200] = { schema: {"user": {"UserId": "number", "Name": "string", "Lastname": "string", "Email": "string", "Phone": "string", "RoleId": "number", "GroupId": "number"}, "newAccessToken": "string" } }
                    } else {
                        res.status(204).json({ message: "No user was found with given userId.", newAccessToken }); // #swagger.responses[204] = { schema : {"message": "No user was found with given userId.", "newAccessToken": "string"}}
                    }
                }, error => {
                    res.status(500).json({ message: "Error while trying to get user. Reason: " + error.detail });
                })
                .catch(error => {
                    res.status(500).json({ message: "Error while trying to get user. Reason: " + error.detail });
                });
        } else {
            res.status(400).json({ message: "You must provide userId query param!" }); // #swagger.responses[400] = { schema : {"message": "You must provide userId query param!"}}
        }
    })
}

exports.update_user = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for updating user'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['User'] = {
          in: 'body',
          required: true,
          type: 'object',
          schema: {"userId": "number", "name": "string", "lastname": "string", "email": "string", "phone": "string", "password": "string", "roleId": "number", "groupId": "number"}
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (user, newAccessToken) => {
        const userId = user.userId;
        if (userId) {
            pool
                .query(
                    "UPDATE \"USER\" " +
                    "SET \"Name\" = $1::text, \"Lastname\" = $2::text, \"Email\" = $3::text, \"Phone\" = $4::text, \"RoleId\" = $5 " +
                    "WHERE \"UserId\" = $6",
                    [user.name, user.lastname, user.email, user.phone, user.roleId, userId]
                )
                .then(dbResponse => {
                    pool
                        .query(
                            "UPDATE \"USER_GROUP\" " +
                            "SET \"GroupId\" = $1 " +
                            "WHERE \"UserId\" = $2",
                            [user.groupId, userId])
                        .then(dbResponse2 => {
                            res.json({ message: "Successfully updated user.", newAccessToken }); // #swagger.responses[200] = { schema: {"message": "Successfully updated user.", "newAccessToken": "string" } }
                        }, error => {
                            console.log(error);
                            res.status(500).json({ message: "Error while trying to update user's group. Reason: " + error.detail });
                        })
                        .catch(error => {
                            res.status(500).json({ message: "Error while trying to update user's group. Reason: " + error.detail });
                        })
                }, err1 => {
                    console.log(err1);
                    res.status(500).json({ message: "Error while trying to update user. Reason: " + err1.detail }); // #swagger.responses[500] = { schema: {"message": "Error while trying to update user. Reason: string"} }
                })
                .catch(err1 => {
                    res.status(500).json({ message: "Error while trying to update user. Reason: " + err1.detail });
                });
        } else {
            res.status(400).json({ message: "You must provide userId in body!" }); // #swagger.responses[400] = { schema : {"message": "You must provide userId in body!"}}
        }
    });
}

exports.delete_user = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for deleting user'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['userId'] = {
          in: 'query',
          required: true,
          type: 'integer'
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (user, newAccessToken) => {
        const userId = req.query.userId;

        if (userId) {
            pool
                .query("DELETE FROM \"USER_GROUP\" WHERE \"UserId\" = $1", [userId])
                .then(dbResponse => {
                    pool
                        .query("DELETE FROM \"USER\" WHERE \"UserId\" = $1", [userId])
                        .then(dbResponse => {
                            if (dbResponse.rowCount > 0) {
                                res.status(200).json({ message: "Successfully deleted user!", newAccessToken }); // #swagger.responses[200] = { schema : {"message": "Successfully deleted user!", "newAccessToken": "string"}}
                            } else {
                                res.status(204).json({ message: "No users were deleted.", newAccessToken }); // #swagger.responses[204] = { schema : {"message": "No users were deleted.", "newAccessToken": "string"}}
                            }
                        }, error => {
                            res.status(500).json({ message: "Error while trying to remove user. Reason: " + error.detail }); // #swagger.responses[500] = { schema : {"message": "Error while trying to remove user. Reason: string"}}
                        })
                        .catch(error => {
                            res.status(500).json({ message: "Error while trying to remove user. Reason: " + error.detail });
                        });
                }, error => {
                    res.status(500).json({ message: "Error while trying to remove user's group. Reason: " + error.detail });
                })
                .catch(error => {
                    res.status(500).json({ message: "Error while trying to remove user's group. Reason: " + error.detail });
                })
        } else {
            res.status(400).json({ message: "You must provide userId query param!" }); // #swagger.responses[400] = { schema : {"message": "You must provide userId query param!"}}
        }
    });
}

exports.get_all_users = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for getting all users'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (body, newAccessToken) => {
        pool.query("SELECT * FROM \"USER\"").then(dbResponse => {
            let users = dbResponse.rows;
            res.status(200).json({ users, newAccessToken }); // #swagger.responses[200] = { schema : {"users": [{"UserId": 2,"Name": "Aya","Lastname": "Ayić","Email": "aayić@aya.com","Phone": "433444","RoleId": 2,"Password": "string","QrSecret": "null","Address": "null","EmailVerified": "null"},{"UserId": 3,"Name": "Osoba1","Lastname": "Osobić","Email": "osoba1@email.com","Phone": "061111111","RoleId": 1,"Password": "string","QrSecret": "null","Address": "null","EmailVerified": "null"}], "newAccessToken": "string"}}
        }, err1 => {
            res.status(500).json({ message: "Error while trying to get users. Reason: " + err1.detail }); // #swagger.responses[500] = { schema : {"message": "Error while trying to get users. Reason: "}}
        }).catch(err1 => {
            res.status(500).json({ message: "Error while trying to get users. Reason: " + err1.detail });
        });
    });
}


exports.set_role = async (req, res) => {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for setting user\'s role'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['Body data'] = {
          in: 'body',
          required: true,
          type: 'object',
          schema: {"userId": "number", "roleId": "number"}
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (body, newAccessToken) => {
        const roleId = body.roleId;
        const userId = body.userId;
        pool.query("UPDATE \"USER\" SET \"RoleId\"=$1 WHERE \"UserId\"=$2", [roleId, userId]).then(dbResponse => {
            if (dbResponse.rowCount > 0) {
                res.status(200).json({ message: "Successfully assigned user role", newAccessToken }); // #swagger.responses[200] = { schema : {"message": "Successfully assigned user role", "newAccessToken": "string"}}
            } else {
                res.status(204).json({ message: "No user was found with given userId.", newAccessToken }); // #swagger.responses[204] = { schema : {"message": "No user was found with given userId.", "newAccessToken": "string"}}
            }
        }, err1 => {
            res.status(500).json({ message: "Error while trying to update user's role. Reason: " + err1.detail }); // #swagger.responses[500] = { schema : {"message": "Error while trying to update user's role. Reason: "}}
        }).catch(err1 => {
            res.status(500).json({ message: "Error while trying to update user's role. Reason: " + err1.detail });
        });
    });
}

exports.set_users_group = function (req, res) {
    // #swagger.tags = ['User CRUD']
    // #swagger.description = 'Endpoint for setting user\'s group'
    /* #swagger.parameters['JWT'] = {
          in: 'header',
          description: 'Jwt verification.',
          required: true,
          type: 'string',
          name: 'Authorization',
          description: 'Bearer token'
   } */
    /* #swagger.parameters['Body data'] = {
          in: 'body',
          required: true,
          type: 'object',
          schema: {"groupId": "number", "roleId": "number"}
   } */
    // #swagger.responses[403] = { schema: {"message": "User does not have a SuperAdmin role!"} }
    verify_user(req, res, (body, newAccessToken) => {
        const groupId = body.groupId;
        const userId = body.userId;
        pool.query("UPDATE \"USER_GROUP\" SET \"GroupId\" = $1 WHERE \"UserId\" = $2", [groupId, userId]).then(dbResponse => {
            if (dbResponse.rowCount > 0) {
                res.status(200).json({ message: "Successfully changed user's group.", newAccessToken }); // #swagger.responses[200] = { schema : {"message": "Successfully changed user's group.", "newAccessToken": "string"}}
            } else {
                res.status(204).json({ message: "No user was found with given userId.", newAccessToken }); // #swagger.responses[204] = { schema : {"message": "No user was found with given userId.", "newAccessToken": "string"}}
            }
        }, err1 => {
            res.status(500).json({ message: "Error while trying to add user's group. Reason: " + err1.detail }); // #swagger.responses[500] = { schema : {"message": "Error while trying to add user's group. Reason: "}}
        }).catch(err1 => {
            res.status(500).json({ message: "Error while trying to add user's group. Reason: " + err1.detail });
        });
    })
}

//for testing
exports.delete_user_by_email = function (req, res) {
    verify_user(req, res, (user, newAccessToken) => {
        const email = req.query.email;

        if (email) {
            pool
                .query("SELECT * FROM \"USER\" WHERE \"Email\" = $1", [email]).then(dbResponse => {
                    let users = dbResponse.rows;

                    if (users.length != 0) {

                        pool
                            .query("DELETE FROM \"USER_GROUP\" WHERE \"UserId\" = $1", [users[0].UserId])
                            .then(dbResponse => {
                                pool
                                    .query("DELETE FROM \"USER\" WHERE \"UserId\" = $1", [users[0].UserId])
                                    .then(dbResponse => {
                                        if (dbResponse.rowCount > 0) {
                                            res.status(200).json({ message: "Successfully deleted user!", newAccessToken });
                                        } else {
                                            res.status(204).json({ message: "No users were deleted.", newAccessToken });
                                        }
                                    }, error => {
                                        res.status(500).json({ message: "Error while trying to remove user. Reason: " + error.detail });
                                    })
                                    .catch(error => {
                                        res.status(500).json({ message: "Error while trying to remove user. Reason: " + error.detail });
                                    });
                            }, error => {
                                res.status(500).json({ message: "Error while trying to remove user's group. Reason: " + error.detail });
                            })
                            .catch(error => {
                                res.status(500).json({ message: "Error while trying to remove user's group. Reason: " + error.detail });
                            })

                    }
                    else
                        res.status(200).json({ message: "User can not be deleted because he does not exist.", newAccessToken })
                }, err1 => {
                    res.status(500).json({ message: "Error while trying to get users. Reason: " + err1.detail });
                }).catch(err1 => {
                    res.status(500).json({ message: "Error while trying to get users. Reason: " + err1.detail });
                });

        } else {
            res.status(400).json({ message: "You must provide email query param!" });
        }
    });
}
