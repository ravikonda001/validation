$(document).ready(function () {    
    var warning = new SessionWarning();
    warning.init("Your session will expire in less than {0} minute(s).", "Your session has expired.");
});

var SessionWarning = (function () {
    var ms_pollingInterval = 60000; //check every 1 minute
    var min_currSessionTime = min_CurrSessionTime; //session expires after 15 minutes of inactivty 15
    var min_sessionWarning = min_SessionWarning; //warn user after 13 minutes of inactivty
    var lastActivity = new Date();
    var lastUserActivity = null;
    var warningMessage = "";
    var expiredMessgae = "";
    var keepAlive = "/vz/myInfo/_apCoachingDashboard/CoachingAlive.aspx";
    var dialog = null;
    var timer = null;
    
    function interval() {
        var now = new Date();
        var ms_timePassed = now - lastActivity;
        var min_timePassed = ms_timePassed / 1000 / 60;

        //Extend session if last activity was 5 minutes or less (typing as activity);
        if (lastUserActivity != null && ((now - lastUserActivity) / 1000 / 60) <= 5) {
            lastUserActivity = null;
            recordActivity();
            extendSession();
        }
        else if (min_timePassed >= min_sessionWarning) {
            if (min_timePassed >= min_currSessionTime) {
                clearTimer();
                expireSession();
            }
            else {
                if (!dialog.is(":visible")) {
                    setDialogMessage(warningMessage.replace("{0}", Math.ceil(min_currSessionTime - min_timePassed)));
                    dialog.modal("show");
                }
                else {
                    setDialogMessage(warningMessage.replace("{0}", Math.ceil(min_currSessionTime - min_timePassed)));
                }
            }
        }
        else if (min_timePassed >= min_currSessionTime) {
            clearTimer();
            expireSession();
        }
    }

    function startTimer() {
        setInterval(interval, ms_pollingInterval);
    }

    function clearTimer() {
        clearInterval(timer);
    }

    function recordActivity() {
        lastActivity = new Date();
    }

    function recordUserActivity() {
        lastUserActivity = new Date();
    }

    function reset() {
        recordActivity();
    }

    function warningDialog() {
        recordActivity();
    }

    function CreateDialog(DialogTitle) {
        if (dialog == null) {
            var html = [''];
            html[html.length] = '<div id="SessionWarningDialog" class="modal">';
            html[html.length] = '<div class="modal-dialog">';
            html[html.length] = '<div class="modal-content">';
            html[html.length] = '<div class="modal-header">';
            html[html.length] = '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';
            html[html.length] = '<h4 class="modal-title">' + DialogTitle + '</h4></div>';
            html[html.length] = '<div class="modal-body"><span id="WarningMessage"></span></div>';
            html[html.length] = '<div class="modal-footer">';
            html[html.length] = '<button type="button" id="btnSessionExtend" class="btn btn-default" data-dismiss="modal">Extend Session</button>';
            html[html.length] = '</div></div></div></div>';
            $(document.body).append(html.join(''));

            dialog = $("#SessionWarningDialog");
            dialog.find("#btnSessionExtend").off("click").on("click", function () {
                extendSession();
                dialog.modal("hide");
            });
        }
        return dialog;
    }

    function setDialogMessage(msg) {
        dialog.find("#WarningMessage").text(msg);
    }

    function extendSession() {
        //var img = new Image(1, 1);
        //img.src = keepAlive;
        $.ajax({
            url: keepAlive,
            cache: false,
            success: function (msg) {
                reset();
                dialog.modal("hide");
            },
            error: function (msg, status, error) {
                miShared.ShowAlertModal("Error extending session. Please save your work.");
            }
        });
        reset();
    }

    function expireSession() {
        window.location = "/vz/myInfo/_apCoachingDashboard/Logout.aspx";
    }

    return {
        init: function (WarningMessage, ExpiredMessage) {
            warningMessage = WarningMessage;
            expiredMessage = ExpiredMessage;
            $(document).bind("keypress.session, click.session", function () {
                recordUserActivity();
            }).ajaxStart(function () {
                recordActivity();
            });

            dialog = CreateDialog("Session Expiration Warning");
            startTimer();
        },
        recordActivity: function () {
            recordActivity();
        },
        resetWarning: function () {
            reset();
        },
        expireSession: function () {
            expireSession();
        },
        extendSession: function () {
            extendSession();
        }
    }
});
