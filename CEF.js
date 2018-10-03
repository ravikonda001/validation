var coachingEffectiveness = (function () {
    var pageParms = {
        encryptedParms: ""
    };

    //API URLs
    var getDateGroupingListAPI = baseURL + "api/Common/GetDateGroups";
    var hasDirectReportsAPI = baseURL + "api/Common/HasDirectReports";
    var checkAccessPermissionAPI = baseURL + "api/Common/CheckAccessPermission";
    var getMetricGroupsAPI = baseURL + "api/CoachingCommitments/GetMetricGroups";
    var getEmployeeMetricsAPI = baseURL + "api/CoachingCommitments/GetEmployeeMetrics";
    var getTeamMetricsAPI = baseURL + "api/CoachingCommitments/GetTeamMetrics";

    //Controls
    var $hdnParms = $("#hdnParms");
    var $hdnSelectedEmpName = $("#hdnSelectedEmpName");
    var $txtSearch = $("#txtSearch");
    var $ddlDateGrouping = $("#ddlDateGrouping");
    var $txtStartDate = $("#txtStartDate");
    var $txtEndDate = $("#txtEndDate");
    var $divEndDate = $("#divEndDate");
    var $btnView = $("#btnView");
    var $lblGroupSelection = $("#lblGroupSelection");
    var $ddlGroupSelection = $("#ddlGroupSelection");
    var $lblPageHeader = $("#lblPageHeader");
    var $btnExport = $("#btnExport");

    var $hdnActiveTabID = $("#hdnActiveTabID");
    var $tabCoaching = $("#tabCoaching");
    var $tabKpiTrends = $("#tabKpiTrends");

    var $pnlCoachingSessions = $("#pnlCoachingSessions");
    var $pnlCommitments = $("#pnlCommitments");
    var $pnlTeamLeaderCoachingSessions = $("#pnlTeamLeaderCoachingSessions");
    var $divCoachingSessions = $("#divCoachingSessions");
    var $divCommitments = $("#divCommitments");
    var $divTeamLeaderCoachingSessions = $("#divTeamLeaderCoachingSessions");

    var $pnlCoachingSessionsByKPI = $("#pnlCoachingSessionsByKPI");
    var $divCoachingSessionsByKPI = $("#divCoachingSessionsByKPI");

    return {
        init: function () {
            $(document).ready(function () {
                pageParms.encryptedParms = $hdnParms.val();
                $hdnActiveTabID.val($('.nav-tabs .active').attr("id"));
                
                $txtSearch.autocomplete({
                    minLength: 3,
                    source: EmployeeSearch,
                    select: function (event, ui) {
                        coachingEffectiveness.employeeNameSelect(event, ui.item.id, ui.item.value, ui.item.label);
                    }
                });

                $.when(coachingEffectiveness.populateDateGroupingDropdown())
                .then(function () {
                    $("#ddlDateGrouping option[value='M']").prop("selected", true);

                    //Initially Populate MonthToDate data
                    coachingEffectiveness.viewButtonClick($hdnActiveTabID.val());
                });

                coachingEffectiveness.initializePageControls();

                $txtSearch.blur(function () {
                    if ($txtSearch.val().length == 0) {
                        coachingEffectiveness.validateSearchParms();
                    }
                });

                $txtStartDate.datepicker().on("change.dp", function (e) {
                    coachingEffectiveness.validateSearchParms();
                });

                $txtEndDate.datepicker().on("change.dp", function (e) {
                    coachingEffectiveness.validateSearchParms();
                });

                //Tab Click event
                $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
                    $hdnActiveTabID.val($(e.target).closest("li").attr("id"));
                    switch ($hdnActiveTabID.val()) {
                        case "coaching-tab":
                            if ($divCoachingSessions.is(":empty") && $divCommitments.is(":empty") && $divTeamLeaderCoachingSessions.is(":empty"))
                                coachingEffectiveness.viewButtonClick($hdnActiveTabID.val());

                            break;

                        case "kpiTrends-tab":
                            if ($divCoachingSessionsByKPI.is(":empty"))
                                coachingEffectiveness.viewButtonClick($hdnActiveTabID.val());

                            break;
                    }
                });

            });

            //Control's events
            $ddlGroupSelection.change(function () { coachingEffectiveness.ddlGroupSelectionChange(this); });
            $ddlDateGrouping.change(function () { coachingEffectiveness.ddlDateGroupSelectionChange(this); });
            $btnView.click(function () { coachingEffectiveness.viewButtonClick($hdnActiveTabID.val()); });
            $btnExport.click(function () { coachingEffectiveness.exportMetrics(); });
        },

        initializePageControls: function () {
            coachingEffectiveness.initializeDateControls();
            $txtStartDate.datepicker('setDate', 'today');
            $txtEndDate.datepicker('setDate', 'today');
        },

        initializeDateControls: function () {
            var nowTemp = new Date();
            var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
            var startDt = "";

            $('#txtStartDate').datepicker({
                dateFormat: "mm/dd/yy",
                changeMonth: true,
                changeYear: true,
                disabled: false,
                autoclose: true,
                onRender: function (date) {
                    return date.valueOf() < now.valueOf() ? 'disabled' : '';
                }
            }).on('changeDate', function (ev) {
                if (typeof ev.date == 'undefined')
                    return;

                startDt = ev.date;
                $txtEndDate.datepicker("setStartDate", ev.date);

                if ($txtEndDate.val().length == 0)
                    return;

                if (new Date($txtStartDate.val()).valueOf() > new Date($txtEndDate.val()).valueOf()) {
                    $txtEndDate.datepicker('setDate', startDt);
                }
            }).data('datepicker');

            $('#txtEndDate').datepicker({
                dateFormat: "mm/dd/yy",
                changeMonth: true,
                changeYear: true,
                disabled: false,
                autoclose: true,
                startDate: startDt,
                onRender: function (date) {
                    return date.valueOf() <= startDt.valueOf() ? 'disabled' : '';
                }
            }).on('changeDate', function (ev) {
                var d = ev.date;
            }).data('datepicker');
        },

        getActiveTab: function () {
            var activeTabControl;

            switch ($hdnActiveTabID.val()) {
                case "coaching-tab":
                    activeTabControl = $tabCoaching;
                    break;

                case "kpiTrends-tab":
                    activeTabControl = $tabKpiTrends;
                    break;
            }

            return activeTabControl;
        },

        initializeTabs: function (activeTabID) {
            switch (activeTabID) {
                case "coaching-tab":
                    coachingEffectiveness.initializeCoachingCommitmentTab();
                    break;

                case "kpiTrends-tab":
                    coachingEffectiveness.initializeKPITrendsTab();
                    break;
            }
        },

        initializeCoachingCommitmentTab: function () {
            $divCoachingSessions.empty();
            $pnlCoachingSessions.hide();
            $divCommitments.empty();
            $pnlCommitments.hide();
            $divTeamLeaderCoachingSessions.empty();
            $pnlTeamLeaderCoachingSessions.hide();
        },

        initializeKPITrendsTab: function() {
            $divCoachingSessionsByKPI.empty();
            $pnlCoachingSessionsByKPI.hide();
        },

        showSearchIncompleteMessage: function(tabControl) {
            if ($("#divAlert").css('visibility') === 'visible') {
                $("#divAlert").remove();
            }

            tabControl.append(coachingEffectiveness.getSearchIncompleteHtml());
        },

        getSearchIncompleteHtml: function() {
            return "<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; Please select all appropriate search criteria and click View button to see the dashboard. </div>";
        },

        showNoDataMessage: function (tabControl) {
            if ($("#divAlert").css('visibility') === 'visible') {
                $("#divAlert").remove();
            }
            tabControl.append(coachingEffectiveness.getNoDataMessageHtml());
        },

        getNoDataMessageHtml: function () {
            return "<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; No Results - There is no dashboard data found for the selected search criteria. You can change the search criteria and click View button to see the dashboard. </div>";
        },

        showNoAccessMessage: function(tabControl) {
            if ($("#divAlert").css('visibility') === 'visible') {
                $("#divAlert").remove();
            }
            tabControl.append(coachingEffectiveness.getNoAccessMessageHtml());
        },

        getNoAccessMessageHtml: function () {
            var message;
            if ($ddlGroupSelection.val() == "1") {
                message = "Selected employee's dashboard is not enabled to view. You can look for other employee's dashboard.";
            } else {
                message = "Selected employee's team dashboard is not enabled to view. You can look for other employee's team dashboard.";
            }

            return "<div id=\"divAlert\" class=\"alert alert-danger\" role=\"alert\"><i class='glyphicon glyphicon-exclamation-sign'></i>&nbsp; " + message +" </div>";
        },

        showValidationMessage: function (tabControl, message) {
            if ($("#divAlert").css('visibility') === 'visible') {
                $("#divAlert").remove();
            }
            tabControl.append(coachingEffectiveness.getValidationMessage(message));
        },

        getValidationMessage: function(message) {
            return "<div id=\"divAlert\" class=\"alert alert-danger\" role=\"alert\"><strong>Error!</strong>&nbsp;&nbsp;" + message + "</div>";
        },

        employeeNameSelect: function (e, employeeID, employeeName, employeeNameAndTitle) {
            coachingDashboardShared.ShowLoadingModal();

            $("#searchEmpID").val(employeeID);

            if (employeeName == "My Team") {
                $txtSearch.val(employeeName);
                $hdnSelectedEmpName.val(employeeName);

                //Set to "By Team"
                $("#ddlGroupSelection option[value='2']").prop("selected", true);
                $ddlGroupSelection.prop("title", "No applicable");
                $ddlGroupSelection.prop("disabled", true);
                $lblGroupSelection.prop("disabled", true);

                $txtStartDate.datepicker('setDate', 'today');
                $divEndDate.hide();

                //Set back all the default values for View button (Logged in employee should be allowed to view his/her own team data)
                $btnView.prop("disabled", false);
                $btnView.prop("title", "");
                $btnView.css('cursor', 'pointer');

                coachingDashboardShared.RemoveLoadingModal();
            }
            else {
                if (typeof employeeNameAndTitle != 'undefined') {
                    $txtSearch.val(employeeNameAndTitle);
                } else {
                    $txtSearch.val(employeeName);
                }

                $hdnSelectedEmpName.val(employeeName);

                var model = {
                    encryptedParms: pageParms.encryptedParms,
                    search: employeeID,
                    tool: "CoachingDashboard"
                }

                //Check whether the logged in Employee has access permission for the selected Employee
                var parms = JSON.stringify(model);

                $.when(coachingEffectiveness.checkAccessPermission(parms))
                    .then(
                        function (msg) {
                            if (msg == true) {
                                //Has Permission to access other employee records
                                $btnView.prop("disabled", false);
                                $btnView.prop("title", "");
                                $btnView.css('cursor', 'pointer');

                                //Find out whether the selected employee has direct reports or not
                                coachingDashboardShared.CallService(hasDirectReportsAPI, parms, coachingEffectiveness.hasDirectReportsSuccess, coachingEffectiveness.hasDirectReportsError);
                            }
                            else {
                                //Do not have permission to access other employee records
                                var message;
                                if ($ddlGroupSelection.val() == "1") {
                                    message = "Employee Dashboard is not enabled to view."
                                } else {
                                    message = "Team Dashboard is not enabled to view."
                                }

                                $btnView.prop("disabled", true);
                                $btnView.prop("title", message);
                                $btnView.css('cursor', 'not-allowed');

                                coachingEffectiveness.showNoAccessMessage(coachingEffectiveness.getActiveTab());
                                coachingDashboardShared.RemoveLoadingModal();
                            }
                        },
                        function (msg) {
                            var message;
                            if ($ddlGroupSelection.val() == "1") {
                                message = "Employee Dashboard is not enabled to view."
                            } else {
                                message = "Team Dashboard is not enabled to view."
                            }

                            $btnView.prop("disabled", false);
                            $btnView.prop("title", message);
                            $btnView.css('cursor', 'not-allowed');

                            coachingEffectiveness.showNoAccessMessage(coachingEffectiveness.getActiveTab());
                            coachingDashboardShared.RemoveLoadingModal();
                        });
            }
        },

        checkAccessPermission: function (parms) {
            var dfd = new $.Deferred();

            coachingDashboardShared.CallService(checkAccessPermissionAPI, parms,
                    function (msg) {
                        dfd.resolve(msg);
                    },
                    function (msg) {
                        dfd.resolve(msg);
                    });

            return dfd.promise();
        },

        hasDirectReportsSuccess: function(msg){
            if (typeof msg != 'undefined') {
                if (msg == true) {
                    // Has Direct Reports, 
                    // Enable GroupSelection & set GroupSelection = "By Team" and hide End Date
                    $("#ddlGroupSelection option[value='2']").prop("selected", true);       //Set to "By Team"
                    $ddlGroupSelection.prop("title", "");
                    $ddlGroupSelection.prop("disabled", false);
                    $lblGroupSelection.prop("disabled", false);

                    $txtStartDate.datepicker('setDate', 'today');
                    $divEndDate.hide();
                }
                else {
                    // No Direct Reports, (Employee View)
                    // Disable GroupSelection & set GroupSelection = "By Employee" and show End Date
                    if ($hdnSelectedEmpName.val() == "My Team") {
                        //Set to "By Team"
                        $("#ddlGroupSelection option[value='2']").prop("selected", true);
                    }
                    else {
                        //Set to "By Employee"
                        $("#ddlGroupSelection option[value='1']").prop("selected", true);
                    }

                    $ddlGroupSelection.prop("title", "No applicable");
                    $ddlGroupSelection.prop("disabled", true);
                    $lblGroupSelection.prop("disabled", true);

                    $txtStartDate.datepicker('setDate', coachingEffectiveness.getCurrentMonthFirstDate());
                    $divEndDate.show();
                }
            }
            else {
                $("#ddlGroupSelection option[value='2']").prop("selected", true);
                $ddlGroupSelection.prop("title", "");
                $ddlGroupSelection.prop("disabled", false);
                $lblGroupSelection.prop("disabled", false);

                $txtStartDate.datepicker('setDate', 'today');
                $divEndDate.hide();
            }
            coachingDashboardShared.RemoveLoadingModal();
        },

        hasDirectReportsError: function (msg) {
            coachingDashboardShared.RemoveLoadingModal();
            coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), msg);
        },

        populateDateGroupingDropdown: function () {
            var dfd = new $.Deferred();

            var model = {};
            var parms = JSON.stringify(model);

            coachingDashboardShared.CallService(getDateGroupingListAPI, parms, function (msg) {
                $ddlDateGrouping.empty();

                if (msg.length > 0) {
                    $.each(msg, function (i, d) {
                        $ddlDateGrouping.append($("<option></option>").val(d.DateType).html(d.DateTypeDescription));
                    });

                    dfd.resolve();
                }
                else {
                    dfd.reject();
                }
            },
            coachingEffectiveness.getDateGroupingListError);

            return dfd.promise();
        },

        getDateGroupingListSuccess: function(msg) {
            $ddlDateGrouping.empty();
            $ddlDateGrouping.append($("<option></option>").val('').html('--Select--'));

            $.each(msg, function (i, d) {
                $ddlDateGrouping.append($("<option></option>").val(d.DateType).html(d.DateTypeDescription));
            });

            $("#ddlDateGrouping option[value='M']").prop("selected", true);
            coachingDashboardShared.RemoveLoadingModal();
        },

        getDateGroupingListError: function (msg) {
            coachingDashboardShared.RemoveLoadingModal();
            coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), msg);
        },

        getCurrentMonthFirstDate: function()
        {
            var date = new Date();
            return new Date(date.getFullYear(), date.getMonth(), 1);
        },

        ddlGroupSelectionChange: function (ddl) {
            switch ($(ddl).val())
            {
                case "1":       //By Employee
                    //Set start date based on the "DateGrouping" selection
                    $txtStartDate.datepicker('setDate', coachingEffectiveness.getStartDateForDateGroup($ddlDateGrouping));

                    $txtEndDate.datepicker("setDate", "today");
                    $divEndDate.show();

                    if ($btnView.prop("disabled"))
                        $btnView.prop("title", "Employee Dashboard is not enabled to view.");

                    break;

                case "2":       //By Team
                    if ($hdnSelectedEmpName.val() != "My Team") {
                        $txtStartDate.datepicker('setDate', 'today');
                        $divEndDate.hide();

                        if ($btnView.prop("disabled"))
                            $btnView.prop("title", "Team Dashboard is not enabled to view.");
                    }
                    break;
            }
        },        

        ddlDateGroupSelectionChange: function (ddl) {
            if ($ddlGroupSelection.val() == "1")
                $txtStartDate.datepicker('setDate', coachingEffectiveness.getStartDateForDateGroup(ddl));
        },

        getStartDateForDateGroup: function (ddl) {
            var result;
            var todaysDate = new Date();

            switch ($(ddl).val().toLowerCase()) {
                case "d":
                    //Get 7 days ago date
                    result = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate() - 6);
                    break;

                case "w":
                    //Get Sunday of 6 weeks ago
                    var tempSixWeekAgo = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate() - 35);
                    result = coachingDashboardShared.getSundayOfWeek(tempSixWeekAgo);
                    break;

                case "m":
                    //Get First day of 12 months ago
                    var tempTwelveMonthAgo = new Date(todaysDate.getFullYear(), todaysDate.getMonth() - 11, todaysDate.getDate());
                    result = coachingDashboardShared.getFirstDayOfMonth(tempTwelveMonthAgo);
                    break;

                case "q":
                    //Get First day of 4 quarters ago
                    var currentYear = todaysDate.getFullYear();
                    var currentQuarter = Math.floor((todaysDate.getMonth() + 3) / 3);
                    var remainingQuarter = 4 - currentQuarter;

                    var quarterStartMonths = [0, 9, 6, 3];      //Jan, Oct, Jul, Apr
                    var year = [currentYear, currentYear - 1, currentYear - 1, currentYear - 1];

                    result = new Date(year[remainingQuarter], quarterStartMonths[remainingQuarter], 1);

                    break;
                case "h":
                    //Get First day of 2 half years ago
                    var currentYear = todaysDate.getFullYear();
                    var currentHalfYear = Math.floor((todaysDate.getMonth() + 6) / 6);
                    var remainingHalfYear = 2 - currentHalfYear;

                    var halfYearStartMonths = [0, 6];       //Jan, Jul
                    var year = [currentYear, currentYear - 1];

                    result = new Date(year[remainingHalfYear], halfYearStartMonths[remainingHalfYear], 1);

                    break;

                case "y":
                    //Get First day of 1 year ago
                    result = coachingDashboardShared.getYearStartDate(todaysDate);
                    break;
            }

            return result.toLocaleDateString().replace(/[^ -~]/g, '');
        },

        viewButtonClick: function (selectedTabID) {
            if (coachingEffectiveness.validateSearchParms() == false)
                return;
            
            coachingEffectiveness.initializeTabs(selectedTabID);

            if ($ddlGroupSelection.val() == "1") {
                //"By Employee"
                $lblPageHeader.text($hdnSelectedEmpName.val());
            } else {
                //"By Team"
                if ($hdnSelectedEmpName.val() == "My Team")
                    $lblPageHeader.text($hdnSelectedEmpName.val());
                else
                    $lblPageHeader.text($hdnSelectedEmpName.val() + ": Team");
            }

            coachingDashboardShared.ShowLoadingModal();
            
            var selectedEmployeeID = $("#searchEmpID").val();
            var selectedGroupBy = $ddlGroupSelection.val();
            var selectedDateGroup = $("#ddlDateGrouping option:selected").val();
            var selectedStartDate = $txtStartDate.val();
            var selectedEndDate = ($divEndDate.is(":visible")) ? $txtEndDate.val(): "";

            if (selectedGroupBy == "1") {
                //By Employee
                var selectedEmployeeID = $("#searchEmpID").val();
                var selectedGroupBy = $ddlGroupSelection.val();
                var selectedDateGroup = $("#ddlDateGrouping option:selected").val();
                var selectedStartDate = $txtStartDate.val();
                var selectedEndDate = $txtEndDate.val();

                var modelByEmployee = {
                    tabIDInternal: selectedTabID,
                    employeeID: selectedEmployeeID,
                    dateGroup: selectedDateGroup,
                    startDate: selectedStartDate,
                    endDate: selectedEndDate,
                    encryptedParms: pageParms.encryptedParms
                };

                var parms = JSON.stringify(modelByEmployee);
                coachingDashboardShared.CallService(getEmployeeMetricsAPI, parms, coachingEffectiveness.getEmployeeMetricsSuccess, coachingEffectiveness.getEmployeeMetricsError);
            }
            else if (selectedGroupBy == "2") {
                //By Team
                var calculatedStartDate = coachingEffectiveness.getTeamMetricStartDate(selectedDateGroup, selectedStartDate);
                var modelByTeam = {
                    tabIDInternal: selectedTabID,
                    employeeID: selectedEmployeeID,
                    dateGroup: selectedDateGroup,
                    startDate: calculatedStartDate,
                    encryptedParms: pageParms.encryptedParms
                };

                var parms = JSON.stringify(modelByTeam);
                coachingDashboardShared.CallService(getTeamMetricsAPI, parms, coachingEffectiveness.getTeamMetricsSuccess, coachingEffectiveness.getTeamMetricsError);
            }
        },
        
        collapseColumns: function(btn) {
            $btnCollpseColumns = $(btn);
            $btnCollpseColumns.text(function(i, text){
                return text == "Expand Columns" ? "Collpase Columns" : "Expand Columns";
            });

            $(".Collapsible").toggle();
        },

        //Team View [Start]-----------------------------------------------------------------------------------------------------------------------------------
        getTeamMetricsSuccess: function(msg){
            if ($("#divAlert").is(":visible"))
                $("#divAlert").remove();

            if (msg.CoachingEffectivenessMetrics.length <= 0) {
                coachingDashboardShared.RemoveLoadingModal();
                coachingEffectiveness.getActiveTab().empty();
                coachingEffectiveness.getActiveTab().append("<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; No Results - No metric groups are defined. Please contact the system administrator.</div>");
                return;
            }

            var activeTabID = msg.CoachingEffectivenessMetrics[0].TabIDInternal;

            for (var i = 0; i < msg.CoachingEffectivenessMetrics.length; i++) {
                var metricGroupID = msg.CoachingEffectivenessMetrics[i].MetricGroup.MetricGroupID;
                var metricGroupName = msg.CoachingEffectivenessMetrics[i].MetricGroup.MetricGroupName.replace(/\s/g, '');

                var metricGroupData = $.grep(msg.CoachingEffectivenessMetrics, function (obj) {
                    return obj.MetricGroup.MetricGroupID == metricGroupID;
                });

                if (metricGroupData[0].TeamMetrics.length > 0) {
                    switch (metricGroupID) {
                        case "1":
                            //Coaching Sessions
                            coachingEffectiveness.getTeamMetricsDashboard($pnlCoachingSessions, $divCoachingSessions, metricGroupData[0], metricGroupName);
                            break;

                        case "2":
                            //Commitments
                            coachingEffectiveness.getTeamMetricsDashboard($pnlCommitments, $divCommitments, metricGroupData[0], metricGroupName);
                            break;

                        case "3":
                            //Team Leader Coaching Sessions
                            coachingEffectiveness.getTeamMetricsDashboard($pnlTeamLeaderCoachingSessions, $divTeamLeaderCoachingSessions, metricGroupData[0], metricGroupName);
                            break;

                        case "4":
                            //Coaching Session by KPI
                            coachingEffectiveness.getTeamMetricsDashboard($pnlCoachingSessionsByKPI, $divCoachingSessionsByKPI, metricGroupData[0], metricGroupName);
                            break;
                    }
                }
            }

            switch (activeTabID) {
                case "coaching-tab":
                    if ($divCoachingSessions.is(":empty") && $divCommitments.is(":empty") && $divTeamLeaderCoachingSessions.is(":empty")) {
                        coachingEffectiveness.initializeCoachingCommitmentTab();
                        coachingEffectiveness.showNoDataMessage($tabCoaching);
                    }
                    break;

                case "kpiTrends-tab":
                    if ($divCoachingSessionsByKPI.is(":empty")) {
                        coachingEffectiveness.initializeKPITrendsTab();
                        coachingEffectiveness.showNoDataMessage($tabKpiTrends);
                    }
                    break;
            }

            coachingDashboardShared.RemoveLoadingModal();
        },

        getTeamMetricsError: function (msg) {
            coachingDashboardShared.RemoveLoadingModal();
            coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), msg);
        },
        
        getTeamMetricsDashboard: function (metricDataPanel, metricDataDiv, metricData, metricGroupName) {
            metricDataDiv.empty();
            var coachingSessionsHtml = [];

            coachingSessionsHtml.push("<table class=\"tblCoachingDashboard\">");
            coachingSessionsHtml.push(coachingEffectiveness.getTeamCoachingSessionsDataHeaderRow(metricData.MetricList, metricGroupName));
            coachingSessionsHtml.push(coachingEffectiveness.getTeamCoachingSessionsDataTable(metricData.EmployeeList, metricData.MetricList, metricData.TeamMetrics, metricGroupName));
            coachingSessionsHtml.push("</table>");

            metricDataDiv.append(coachingSessionsHtml.join(""));
            metricDataDiv.attr("data-metricgroupname", metricGroupName);
            metricDataPanel.show();
        },

        getTeamCoachingSessionsDataHeaderRow: function (metricList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var customClassNameHeaderRow = metricGroupName.concat("HeaderRow");
            var customClassNameGroupHeaderRow = "groupHeaderRow";
            var thHtml = [];
            var groupHeaderHtml = [];
            var collapsibleColumnCount = 0;

            if (metricGroupName == "CoachingSessions")
                groupHeaderHtml.push("<td class=\"" + customClassNameGroupHeaderRow + "\" style=\"text-align: center;\">" +
                                        "<button type='button' id='btnCollapse' class='btn btn-small btn-default'" +
                                        "onClick='coachingEffectiveness.collapseColumns(this);'>Expand Columns</button></td>");

            thHtml.push("<th><div class=\"employeeNameCell " + customClassNameData + "\">Employee</div></th>");

            for (var i = 0; i < metricList.length; i++) {
                if (metricGroupName == "CoachingSessions") {
                    var customClassNameCollapsible = (metricList[i]["IsCollapsible"] === true) ? "Collapsible" : "";

                    if (customClassNameCollapsible.length > 0) {
                        collapsibleColumnCount++;
                        groupHeaderHtml.push("<td class=\"" + customClassNameGroupHeaderRow + " " + customClassNameCollapsible + "\"></td>");
                        thHtml.push("<th class=\"" + customClassNameCollapsible + "\"><div class=\"headerCell " + customClassNameData + "\">" + metricList[i]["MetricName"] + "</div></th>");
                    }
                    else {
                        groupHeaderHtml.push("<td class=\"" + customClassNameGroupHeaderRow + "\"></td>");
                        thHtml.push("<th><div class=\"headerCell " + customClassNameData + "\">" + metricList[i]["MetricName"] + "</div></th>");
                    }
                }
                else {
                    //All other Metric Groups
                    thHtml.push("<th><div class=\"headerCell " + customClassNameData + "\">" + metricList[i]["MetricName"] + "</div></th>");
                }
            }

            //This thead 'data' attribute is used to carry the name for Excel Sheet
            if (metricGroupName == "CoachingSessions") {
                if (collapsibleColumnCount > 0) {
                    var headerHtml = "<thead data-metricgroupname=" + metricGroupName + ">" +
                                        "<tr class=\"" + customClassNameHeaderRow + "\">" +
                                            groupHeaderHtml.join("") +
                                        "</tr>" +
                                        "<tr class=\"" + customClassNameHeaderRow + "\">" +
                                            thHtml.join("") +
                                        "</tr>" +
                                     "</thead>";
                }
                else {
                    var headerHtml = "<thead data-metricgroupname=" + metricGroupName + ">" +                                        
                                        "<tr class=\"" + customClassNameHeaderRow + "\">" +
                                            thHtml.join("") +
                                        "</tr>" +
                                     "</thead>";
                }
            }
            else {
                var headerHtml = "<thead data-metricgroupname=" + metricGroupName + ">" +
                                    "<tr class=\"" + customClassNameHeaderRow + "\">" +
                                        thHtml.join("") +
                                    "</tr>" +
                                 "</thead>";
            }            

            return headerHtml;
        },

        getTeamCoachingSessionsDataTable: function (employeeList, metricList, metricDataList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var customClassNameDataRow = metricGroupName.concat("DataRow");
            var trHtml = [];

            for (var i = 0; i < employeeList.length; i++) {
                var tblRow = "<tr class=\"" + customClassNameDataRow + "\">" +
                                "<td>" +
                                    "<div class=\"employeeNameCell " + customClassNameData + "\">" + employeeList[i]["EmployeeName"] + "</div>" +
                                "</td>" +
                                coachingEffectiveness.getTeamCoachingSessionsDataTableRow(employeeList[i]["EmployeeID"], metricList, metricDataList, metricGroupName);
                             "</tr>";

                trHtml.push(tblRow);
            }

            var dataTableHtml = "<tbody>" +
                                        trHtml.join("") +
                                "</tbody>";

            return dataTableHtml;
        },

        getTeamCoachingSessionsDataTableRow: function (employeeID, metricList, metricDataList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var tblTd = [];
            var metricValue;

            for (var i = 0; i < metricList.length; i++) {
                var metricID = metricList[i]["MetricID"];

                var metricData = $.grep(metricDataList, function (obj) {
                    return obj.EmployeeID === employeeID && obj.MetricID === metricID;
                });

                if (metricData.length > 0) {
                    metricValue = metricData[0]["Result"];
                }
                else {
                    metricValue = "-";
                }

                if (metricGroupName == "CoachingSessions") {                    
                    var customClassNameCollapsible = (metricList[i]["IsCollapsible"] === true) ? "Collapsible" : "";
                    if (customClassNameCollapsible.length > 0)  {
                        tblTd.push("<td class=\"" + customClassNameCollapsible + "\"><div class=\"dataCell " + customClassNameData + "\">" + metricValue + "</div></td>");
                    }
                    else {
                        tblTd.push("<td><div class=\"dataCell " + customClassNameData + "\">" + metricValue + "</div></td>");
                    }
                }
                else {
                    tblTd.push("<td><div class=\"dataCell " + customClassNameData + "\">" + metricValue + "</div></td>");
                }                
            }

            return tblTd.join("");
        },

        getTeamMetricStartDate: function (dateGroup, startDate) {
            var result;
            
            switch (dateGroup.toLowerCase()) {
                case "d":
                    result = new Date(startDate);
                    break;

                case "w":
                    //Get the Sunday of that week
                    result = coachingDashboardShared.getSundayOfWeek(startDate);
                    break;

                case "m":
                    //Get the First Day of that month
                    result = coachingDashboardShared.getFirstDayOfMonth(startDate);
                    break;

                case "q":
                    //Get the First Day of that Quarter
                    result = coachingDashboardShared.getQuarterStartDate(startDate);
                    break;

                case "h":
                    //Get the First Day of that Half Year
                    result = coachingDashboardShared.getHalfYearStartDate(startDate);
                    break;

                case "y":
                    //Get the First Day of that Year
                    result = coachingDashboardShared.getYearStartDate(startDate);
                    break;
            }

            return result.toLocaleDateString().replace(/[^ -~]/g, '');
        },
        //Team View [End]-------------------------------------------------------------------------------------------------------------------------------------


        //Employee View [Start]-----------------------------------------------------------------------------------------------------------------------------------
        getEmployeeMetricsSuccess: function (msg) {
            if ($("#divAlert").is(":visible"))
                $("#divAlert").remove();

            if (msg.CoachingEffectivenessMetrics.length <= 0) {
                coachingDashboardShared.RemoveLoadingModal();
                coachingEffectiveness.getActiveTab().empty();
                coachingEffectiveness.getActiveTab().append("<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; No Results - No metric groups are defined. Please contact the system administrator.</div>");
                return;
            }

            var activeTabID = msg.CoachingEffectivenessMetrics[0].TabIDInternal;

            for (var i = 0; i < msg.CoachingEffectivenessMetrics.length; i++) {
                var metricGroupID = msg.CoachingEffectivenessMetrics[i].MetricGroup.MetricGroupID;
                var metricGroupName = msg.CoachingEffectivenessMetrics[i].MetricGroup.MetricGroupName.replace(/\s/g, '');

                var metricGroupData = $.grep(msg.CoachingEffectivenessMetrics, function (obj) {
                    return obj.MetricGroup.MetricGroupID == metricGroupID;
                });

                if (metricGroupData[0].EmployeeMetrics.length > 0) {
                    switch (metricGroupID) {
                        case "1":
                            //Coaching Sessions
                            coachingEffectiveness.getEmployeeMetricsDashboard($pnlCoachingSessions, $divCoachingSessions, metricGroupData[0], metricGroupName);
                            break;

                        case "2":
                            //Commitments
                            coachingEffectiveness.getEmployeeMetricsDashboard($pnlCommitments, $divCommitments, metricGroupData[0], metricGroupName);
                            break;

                        case "3":
                            //Team Leader Coaching Sessions
                            coachingEffectiveness.getEmployeeMetricsDashboard($pnlTeamLeaderCoachingSessions, $divTeamLeaderCoachingSessions, metricGroupData[0], metricGroupName);
                            break;

                        case "4":
                            //Coaching Session by KPI
                            coachingEffectiveness.getEmployeeMetricsDashboard($pnlCoachingSessionsByKPI, $divCoachingSessionsByKPI, metricGroupData[0], metricGroupName);
                            break;
                    }
                }
            }

            switch (activeTabID) {
                case "coaching-tab":
                    if ($divCoachingSessions.is(":empty") && $divCommitments.is(":empty") && $divTeamLeaderCoachingSessions.is(":empty")) {
                        coachingEffectiveness.initializeCoachingCommitmentTab();
                        coachingEffectiveness.showNoDataMessage($tabCoaching);
                    }
                    break;

                case "kpiTrends-tab":
                    if ($divCoachingSessionsByKPI.is(":empty")) {
                        coachingEffectiveness.initializeKPITrendsTab();
                        coachingEffectiveness.showNoDataMessage($tabKpiTrends);
                    }
                    break;
            }

            coachingDashboardShared.RemoveLoadingModal();
        },

        getEmployeeMetricsError: function (msg) {
            coachingDashboardShared.RemoveLoadingModal();
            coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), msg);
        },

        getEmployeeMetricsDashboard: function (metricDataPanel, metricDataDiv, metricData, metricGroupName) {
            metricDataDiv.empty();
            var coachingSessionsHtml = [];

            coachingSessionsHtml.push("<table class=\"tblCoachingDashboard\">");
            coachingSessionsHtml.push(coachingEffectiveness.getEmployeeCoachingSessionsDataHeaderRow(metricData.DateRangeList, metricGroupName));
            coachingSessionsHtml.push(coachingEffectiveness.getEmployeeCoachingSessionsDataTable(metricData.MetricList, metricData.DateRangeList, metricData.EmployeeMetrics, metricGroupName));
            coachingSessionsHtml.push("</table>");

            metricDataDiv.append(coachingSessionsHtml.join(""));
            metricDataDiv.attr("data-metricgroupname", metricGroupName);
            metricDataPanel.show();
        },

        getEmployeeCoachingSessionsDataHeaderRow: function (dateRangeList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var customClassNameHeaderRow = metricGroupName.concat("HeaderRow");
            var selectedDateGroup = $("#ddlDateGrouping option:selected").val();
            var thHtml = [];

            thHtml.push("<th><div class=\"" + customClassNameData + "\">Metric Name</div></th>");

            for (var i = 0; i < dateRangeList.length; i++) {
                var headerText = coachingEffectiveness.transformDateHeaderText(selectedDateGroup, dateRangeList[i]);
                thHtml.push("<th><div class=\"headerCell " + customClassNameData + "\">" + headerText + "</div></th>");
            }

            //This thead 'data' attribute is used to carry the name for Excel Sheet
            var headerHtml = "<thead data-metricgroupname=" + metricGroupName + ">" +
                                "<tr class=\"" + customClassNameHeaderRow + "\">" +
                                    thHtml.join("") +
                                "</tr>" +
                             "</thead>";

            return headerHtml;
        },

        getEmployeeCoachingSessionsDataTable: function (metricList, dateRangeList, metricDataList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var customClassNameDataRow = metricGroupName.concat("DataRow");
            var trHtml = [];

            for (var i = 0; i < metricList.length; i++) {
                var tblRow = "<tr class=\"" + customClassNameDataRow + "\">" +
                                "<td>" +
                                    "<div class=\"" + customClassNameData + "\">" + metricList[i]["MetricName"] + "</div>" +
                                "</td>" +
                                coachingEffectiveness.getEmployeeCoachingSessionsDataTableRow(metricList[i]["MetricID"], dateRangeList, metricDataList, metricGroupName);
                             "</tr>";

                trHtml.push(tblRow);
            }

            var dataTableHtml = "<tbody>" +
                                        trHtml.join("") +
                                "</tbody>";

            return dataTableHtml;
        },

        getEmployeeCoachingSessionsDataTableRow: function (metricID, dateRangeList, metricDataList, metricGroupName) {
            var customClassNameData = metricGroupName.concat("Data");
            var tblTd = [];
            var metricValue;

            for (var i = 0; i < dateRangeList.length; i++) {
                var dateValue = dateRangeList[i];

                var metricData = $.grep(metricDataList, function (obj) {
                    return obj.MetricID === metricID && obj.StartDate === dateValue;
                });

                if (metricData.length > 0) {
                    metricValue = metricData[0]["Result"];
                }
                else {
                    metricValue = "-";
                }

                tblTd.push("<td><div class=\"dataCell " + customClassNameData + "\">" + metricValue + "</div></td>");
            }

            return tblTd.join("");
        },

        transformDateHeaderText: function(dateGroup, dateValue){
            var date = new Date(dateValue);
            var year = date.getFullYear();
            var headerText = "";

            switch (dateGroup.toLowerCase()) {
                case "d":
                    headerText = dateValue;
                    break;

                case "w":
                    headerText = "Week of " + dateValue;
                    break;

                case "m":
                    var month = date.getMonthName("MMM");
                    headerText = month + "-" + year;
                    break;

                case "q":
                    var quarter = date.getQuarter();
                    headerText = "Q" + quarter + " " + year;
                    break;

                case "h":
                    var halfYear = date.getHalfYear();
                    headerText = "HY" + halfYear.toString() + " " + year;
                    break;

                case "y":
                    headerText = year;
                    break;
            }

            return headerText;
        },
        //Employee View [End]-------------------------------------------------------------------------------------------------------------------------------------


        validateSearchParms: function () {
            var selectedDateGroup = $("#ddlDateGrouping option:selected").val();
            var selectedStartDate = $txtStartDate.val();
            var selectedEndDate = $txtEndDate.val();
            var activeTabControl = coachingEffectiveness.getActiveTab();

            if ($.trim($txtSearch.val()).length == 0) {
                coachingEffectiveness.showValidationMessage(activeTabControl, "Please select employee name.");
                return false;
            }

            if (selectedDateGroup.length == 0) {
                coachingEffectiveness.showValidationMessage(activeTabControl, "Please select date grouping option.");
                return false;
            }

            if ($.trim(selectedStartDate).length == 0) {
                coachingEffectiveness.showValidationMessage(activeTabControl, "Please select start date.");
                return false;
            }

            if (!isValidDate(selectedStartDate)) {
                coachingEffectiveness.showValidationMessage(activeTabControl, "Start date is not valid.");
                return false;
            }

            if (new Date(selectedStartDate).valueOf() > new Date().valueOf()) {
                coachingEffectiveness.showValidationMessage(activeTabControl, "Start date can not be later than Today's date.");
                return false;
            }

            if ($divEndDate.is(":visible")) {
                if ($.trim(selectedEndDate).length == 0) {
                    coachingEffectiveness.showValidationMessage(activeTabControl, "Please select end date.");
                    return false;
                }

                if (!isValidDate(selectedEndDate)) {
                    coachingEffectiveness.showValidationMessage(activeTabControl, "End date is not valid.");
                    return false;
                }

                if (new Date(selectedStartDate).valueOf() > new Date(selectedEndDate).valueOf()) {
                    coachingEffectiveness.showValidationMessage(activeTabControl, "Start date can not be later than End date.");
                    return false;
                }

                if (new Date(selectedEndDate).valueOf() > new Date().valueOf()) {
                    coachingEffectiveness.showValidationMessage(activeTabControl, "End date can not be later than Today's date.");
                    return false;
                }

                //Allow only specific date rang depending up on the Date Group selection           
                switch (selectedDateGroup.toLowerCase()) {
                    case "d":
                        var diffDays = Date.dateDiff("d", new Date(selectedStartDate), new Date(selectedEndDate));

                        if (diffDays >= 7) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than 7 days.");
                            return false;
                        }
                        break;

                    case "w":
                        var tempEndDate = new Date(selectedEndDate);
                        var tempSixWeekAgo = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate() - 35);
                        var sixWeekAgoSunday = coachingDashboardShared.getSundayOfWeek(tempSixWeekAgo);

                        if (new Date(selectedStartDate).valueOf() < new Date(sixWeekAgoSunday).valueOf()) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than 6 weeks.");
                            return false;
                        }
                        break;

                    case "m":
                        var tempEndDate = new Date(selectedEndDate);
                        var tempTwelveMonthAgo = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth() - 11, tempEndDate.getDate());
                        var twelveMonthAgo = coachingDashboardShared.getFirstDayOfMonth(tempTwelveMonthAgo);

                        if (new Date(selectedStartDate).valueOf() < new Date(twelveMonthAgo).valueOf()) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than 12 months.");
                            return false;
                        }
                        break;

                    case "q":
                        var stDate = new Date(selectedStartDate);
                        var stYear = stDate.getFullYear();
                        var stQuarter = Math.floor((stDate.getMonth() + 3) / 3);

                        var edDate = new Date(selectedEndDate);
                        var edYear = edDate.getFullYear();
                        var edQuarter = Math.floor((edDate.getMonth() + 3) / 3);

                        var quarters = 0;
                        var noOfQuarters = 0;
                        var noOfyears = edYear - stYear;

                        if (noOfyears == 0) {
                            return;
                        }

                        if (noOfyears >= 1) {
                            stQuarter = (4 - stQuarter) + 1;
                        }

                        if (noOfyears >= 2) {
                            quarters = (noOfyears - 1) * 4;
                        }

                        noOfQuarters = stQuarter + quarters + edQuarter;

                        if (noOfQuarters > 4) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than 4 quarters.");
                            return false;
                        }

                        break;

                    case "h":
                        var stDate = new Date(selectedStartDate);
                        var stYear = stDate.getFullYear();
                        var stHalfYear = Math.floor((stDate.getMonth() + 6) / 6);

                        var edDate = new Date(selectedEndDate);
                        var edYear = edDate.getFullYear();
                        var edHalfYear = Math.floor((edDate.getMonth() + 6) / 6);

                        var halfYears = 0;
                        var noOfHalfYears = 0;
                        var noOfyears = edYear - stYear;

                        if (noOfyears == 0) {
                            return;
                        }

                        if (noOfyears >= 1) {
                            stHalfYear = (2 - stHalfYear) + 1;
                        }

                        if (noOfyears >= 2) {
                            halfYears = (noOfyears - 1) * 2;
                        }

                        noOfHalfYears = stHalfYear + halfYears + edHalfYear;

                        if (noOfHalfYears > 2) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than 2 half years.");
                            return false;
                        }

                        break;

                    case "y":
                        var currentYearStartDate = coachingDashboardShared.getYearStartDate(selectedEndDate);

                        if (new Date(selectedStartDate).valueOf() < new Date(currentYearStartDate).valueOf()) {
                            coachingEffectiveness.showValidationMessage(activeTabControl, "Date range can not be more than a year.");
                            return false;
                        }
                        break;
                }
            }
        },

        exportMetrics: function () {
            //Export only Current Tab data
            var selectedTabID = $hdnActiveTabID.val();
            var searchCriteriaTableHtml = coachingEffectiveness.getSearchCriteriaDataTable();

            switch (selectedTabID) {
                case "coaching-tab":
                    var dataTableHtml = coachingEffectiveness.getCoachingMetricsDataToExport();
                    break;

                case "kpiTrends-tab":

                    break;
            }

            if (dataTableHtml.length > 0) {
                exportData.exportToExcel($("<div>").append(dataTableHtml).html(), 0, "Coaching Effectiveness", false, true, $("<div>").append(searchCriteriaTableHtml).html());
            }
            else {
                coachingDashboardShared.ShowFixedWarningMsg($(".pageFooter"), "No data to available to export.");
            }
        },
        
        getSearchCriteriaDataTable: function () {
            var searchCriteria = [
                                    { label: "Search Results For:", value: $.trim($txtSearch.val()) },
                                    { label: "Group By:", value: $("#ddlGroupSelection option:selected").text()},
                                    { label: "Date Grouping:", value: $("#ddlDateGrouping option:selected").text() },
                                    { label: "Start Date:", value: $txtStartDate.val() }
                                ];

            if ($divEndDate.is(":visible")) {
                searchCriteria.push({ label: "End Date:", value: $txtEndDate.val() });
            }

            var searchCriteriaHtml = [];
            searchCriteriaHtml.push("<table>");
            searchCriteriaHtml.push("<thead><tr><th>First Column</th><th>Second Column</th></tr></thead>");
            searchCriteriaHtml.push("<tbody>");
            for (var i = 0; i < searchCriteria.length; i++) {
                searchCriteriaHtml.push("<tr><td>" + searchCriteria[i].label + "</td><td>" + searchCriteria[i].value + "</td></tr>");
            }
            searchCriteriaHtml.push("</tbody></table>");

            return searchCriteriaHtml.join("");
        },

        //Get "coaching-tab" Data
        getCoachingMetricsDataToExport: function () {
            var coachingMetricDataTables = [];

            //Get the "data" attribute value for all MetricData divs (To get the MetricGroupNames)
            var metricGroups = $(".metricTableContainer").map(function () {
                return $(this).data("metricgroupname");
            }).get();

            for (var i = 0; i < metricGroups.length; i++) {
                var metricGroupDataTable = coachingEffectiveness.getMetricGroupDataTable(metricGroups[i]);

                if (typeof metricGroupDataTable != 'undefined')
                    coachingMetricDataTables.push(metricGroupDataTable);
            }

            return coachingMetricDataTables.join("");
        },

        //Get each MetricGroup data table html
        getMetricGroupDataTable: function (metricGroupName) {
            var divID = "div" + metricGroupName;
            var customClassNameData = metricGroupName.concat("Data");
            var customClassNameDataRow = metricGroupName.concat("DataRow");
            var table = $(document.createElement("table"));

            if ($("#" + divID).is(":empty"))
                return;

            //Append existing table header
            $("#" + divID + " table thead").clone().appendTo(table);

            //Remove inner div and replace with just text
            table.find("." + customClassNameData).each(function () {
                $(this).contents().unwrap();
            });

            //Add tbody for metric data
            table.append("<tbody></tbody>");
            var tbody = table.find("tbody");

            $("." + customClassNameDataRow).each(function () {
                var tr = $(this).clone();
                //Remove inner div and replace with just text
                tr.find("." + customClassNameData).each(function () {
                    $(this).contents().unwrap();
                });
                tbody.append("<tr>" + tr.html() + "</tr>");
            });

            return table.html();
        },

        getNumberOfMonths: function(fromDate, toDate){
            var diffMonths = (new Date(toDate).getMonth() - new Date(fromDate).getMonth()) + (12 * (new Date(toDate).getFullYear() - new Date(fromDate).getFullYear()));
            if (new Date(fromDate).getDate() < new Date(toDate).getDate()) {
                diffMonths++;
            }

            return diffMonths;
        },

        splitEmployeeNameAndTitle: function (nameAndTitle) {
            var returnValue = [];
            var employeeNameWithTitle = nameAndTitle;

            if (nameAndTitle.indexOf("-") > 0) {
                returnValue[0] = employeeNameWithTitle.substring(0, (employeeNameWithTitle.indexOf("-") - 1));                              // Name
                returnValue[1] = employeeNameWithTitle.substring(employeeNameWithTitle.indexOf("-") + 2, employeeNameWithTitle.length);     // Title
            }
            else {
                returnValue[0] = employeeNameWithTitle;
                returnValue[1] = "";
            }

            return returnValue;
        }

    }
})();

