(function(module) {
    "use strict";
    /* globals app, socket */
    var user           = module.parent.require('./user'),
        meta           = module.parent.require('./meta'),
        db             = module.parent.require('./database'),
        winston        = module.parent.require('winston'),
        passport       = module.parent.require('passport'),
        fs             = module.parent.require('fs'),
        path           = module.parent.require('path'),
        nconf          = module.parent.require('nconf'),
        async          = module.parent.require('async'),
        local_strategy = module.parent.require('passport-local').Strategy,
        ldapjs         = require('ldapjs');

    var config = {};
    var office_ldap = {
        name: "Office LDAP",

        get_domain: function (base) {
            var domain = '';
            if (base !== '') {
                var temp = base.match(/dc=([^,]*)/g);
                if (temp.length > 0) {
                    domain = temp.map(function (str) {
                        return str.match(/dc=([^,]*)/)[1];
                    }).reduce(function (current, previous) {
                        return current + '.' + previous;
                    });
                }
            }
            return domain;
        },
        admin: function (custom_header, callback) {
            custom_header.plugins.push({
                "route": "/plugins/office_ldap",
                "icon": "fa-cog",
                "name": "LDAP Settings"
            });
            callback(null, custom_header);
        },

        init: function(params, callback) {
            function render(req, res, next) {
                res.render('office_ldap', {});
            }

            meta.settings.get('officeldap', function(err, options) {
                config = options;
            });
            params.router.get('/admin/plugins/office_ldap', params.middleware.admin.buildHeader, render);
            params.router.get('/api/admin/plugins/office_ldap', render);
            
            callback();
        },

        get_config: function(options, callback) {
            meta.settings.get('officeldap', function(err, settings) {
                if (err) {
                    return callback(null, options);
                }
				config = settings;
                options.officeldap = settings;
				callback(null, options);
            });
        },

        stringtoint: function (str) {
            return str.split('').map(function (char) {
                return char.charCodeAt(0);
            }).reduce(function (current, previous) {
                return previous + current;
            });
        },

        override: function () {
            var options = {
                url: config.server + ':' + config.port
            };

            passport.use(new local_strategy({
                passReqToCallback: true
            }, function (req, username, password, next) {
                if (!username) {
                    return next(new Error('[[error:invalid-email]]'));
                }
                if (!password) {
                    return next(new Error('[[error:invalid-password]]'));
                }
                var userdetails = username.split('@');
                var client = ldapjs.createClient(options);
                if (userdetails.length == 0) {
                    username = username.trim() + '@' + office_ldap.get_domain(config.base);
                }

                client.bind(username, password, function(err) {
                    if (err) {
                        winston.error(err.message);
                        return next(new Error('[[error:invalid-password]]'));
                    }
                    var opt = {
                        filter: '(&(' + config.filter + '=' + userdetails[0] + '))',
                        scope: 'sub',
                        sizeLimit: 1
                    };

                    client.search(config.base, opt, function (err, res) {
                        if (err) {
                            return next(new Error('[[error:invalid-email]]'));
                        }

                        res.on('searchEntry', function(entry) {
                            var profile = entry.object;
                            var id = office_ldap.stringtoint(profile.displayName);
                            if (!profile.mail) {
                                profile.mail = username;
                            }

                            office_ldap.login(id, profile.displayName, profile.mail, function (err, userObject) {
                                if (err) {
                                    winston.error(err);
                                    return next(new Error('[[error:invalid-email]]'));
                                }
                                return next(null, userObject);
                            });
                        });

                        res.on('error', function(err) {
                            winston.error('error: ' + err.message);
                            return next(new Error('[[error:invalid-email]]'));
                        });
                    });
                });
            }));
        },

        login: function (ldapid, handle, email, callback) {
            var _self = this;
            _self.getuidby_ldapid(ldapid, function (err, uid) {
                if (err) {
                    return callback(err);
                }

                if (uid !== null) {
                    return callback(null, {
                        uid: uid
                    });
                } else {
                    // New User
                    var success = function (uid) {
                        // Save provider-specific information to the user
                        user.setUserField(uid, 'ldapid', ldapid);
                        db.setObjectField('ldapid:uid', ldapid, uid);
                        callback(null, {
                            uid: uid
                        });
                    };

                    return user.getUidByEmail(email, function (err, uid) {
                        if (err) {
                            return callback(err);
                        }

                        if (!uid) {
                            return user.create({username: handle, email: email}, function (err, uid) {
                                if (err) {
                                    return callback(err);
                                }
                                if (config.autovalidate) {
                                    user.setUserField(uid, 'email:confirmed', 1);
                                }
                                return success(uid);
                            });
                        } else {
                            return success(uid); // Existing account -- merge
                        }
                    });
                }
            });
        },

        getuidby_ldapid: function (ldapid, callback) {
            db.getObjectField('ldapid:uid', ldapid, function (err, uid) {
                if (err) {
                    return callback(err);
                }
                return callback(null, uid);
            });
        }
    };

    module.exports = office_ldap;

}(module));
