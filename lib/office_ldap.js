define('admin/plugins/office_ldap', ['settings'], function(Settings) {
    'use strict';
    /* globals $, app, socket, require */

    var ACP = {};

    ACP.init = function() {
        Settings.load('officeldap', $('.ldap-settings'));
        $('#save').on('click', function() {
            Settings.save('officeldap', $('.ldap-settings'), function() {
                app.alert({
                    type: 'success',
                    alert_id: 'officeldap-saved',
                    title: 'Settings Saved',
                    message: 'Please reload your NodeBB to apply these settings',
                    clickfn: function() {
                        socket.emit('admin.reload');
                    }
                });
            });
        });
    };

    return ACP;
});
