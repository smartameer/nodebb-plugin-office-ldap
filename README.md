# NodeBB Office LDAP authentication Plugin

This plugin connects LDAP server without admin credentials but using user given username and password at the time of login.

Please turn off *registration process* as this makes a login / creates a user based on user existance in database via LDAP verification.

[![Build Status](https://travis-ci.org/smartameer/nodebb-plugin-office-ldap.svg?branch=master)](https://travis-ci.org/smartameer/nodebb-plugin-office-ldap) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000?style=plastic)](https://github.com/smartameer/nodebb-plugin-office-ldap/blob/master/LICENSE) [![npm version](https://badge.fury.io/js/nodebb-plugin-office-ldap.svg)](https://badge.fury.io/js/nodebb-plugin-office-ldap) [![Project Status](https://img.shields.io/badge/Project%20Status-Stable-brightgreen.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/nodebb-plugin-office-ldap)

## Installation

    npm install nodebb-plugin-office-ldap

## Screenshots

### Desktop
![Desktop OfficeLDAP](screenshots/desktop.png?raw=true)

### For Developers

- The code now holds only the username based filter. i.e sAMAccountName
    - options are sent now default to [index.js](index.js#L151) as per openldap
- Filter can be configured like this, sample `(&(objectCategory=Person)(sAMAccountName=*))`.
    - Ref cheatsheet: https://gist.github.com/jonlabelle/0f8ec20c2474084325a89bc5362008a7
- Unix command for checking testing and checking is
    - `ldapsearch -H <Serverurl> -x -D <Email> -w <Password> -b <BaseDN> “(<Filter=value>)”`
