# validation
var WFOHistoricalDashboard = (function () {

    //API URLs
    var getFormHistoricalDataAPI = baseURL + "api/WFOHistoricalDashboard/GetWFOHistoricalData";

    //Controls
    var $hdnParms = $("#hdnParms");
    var $hdnSelectedEmpName = $("#hdnSelectedEmpName");
    var $txtSearch = $("#txtSearch");
    var $txtSearchCreatedBy = $("#txtSearch_CreatedBy");
    var $txtStartDate = $("#txtStartDate");
    var $txtEndDate = $("#txtEndDate");
    var $divEndDate = $("#divEndDate");
    var $btnView = $("#btnView");
    var $btnExport = $("#btnExport");
    var $divHistDashResults = $("#divHistDashResults");

    return {
        init: function () {
            $(document).ready(function () {                
                $txtSearch.autocomplete({
                    minLength: 3,
                    source: EmployeeSearch,
                    select: function (event, ui) {
                        WFOHistoricalDashboard.employeeNameSelect(event, ui.item.id, ui.item.value, ui.item.label);
                    }
                });
                $txtSearch.focusout(function () {
                    if ($.trim($txtSearch.val()).length <= 0) {
                        WFOHistoricalDashboard.clearWhoAboutValues();
                    }
                });

                $txtSearchCreatedBy.autocomplete({
                    minLength: 3,
                    source: EmployeeSearch,
                    select: function (event, ui) {
                        WFOHistoricalDashboard.createdByNameSelect(event, ui.item.id, ui.item.value, ui.item.label);
                    }
                });

                $txtSearchCreatedBy.focusout(function () {
                    if ($.trim($txtSearchCreatedBy.val()).length <= 0) {
                        WFOHistoricalDashboard.clearWhoCreatedValues();
                    }
                });

                WFOHistoricalDashboard.initializePageControls();

                $(".bottom").tooltip({
                    placement: "bottom"
                });

                $txtStartDate.datepicker().on("change.dp", function (e) {
                    if ($(e.target).val().length == 0)
                        return;
                    WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
                });

                $txtEndDate.datepicker().on("change.dp", function (e) {
                    WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
                });

                $btnView.click(function () { WFOHistoricalDashboard.viewButtonClick(); });
                $btnExport.click(function () { WFOHistoricalDashboard.exportHistDashboard(); });
                $(window).resize(function () {
                    WFOHistoricalDashboard.ResizeSearchControls();
                    var footerTop = $(".pageFooter").offset().top;
                    $(".pageFooter").offset({ top: footerTop + 30 });
                });
            });
        },
        clearWhoAboutValues: function () {
            $("#searchEmpID").val('-1');
            $("#txtSearch").val('');
            $("#hdnSelectedEmpName").val('');
        },

        clearWhoCreatedValues: function () {
            $("#searchEmpID_CreatedBy").val('-1');
            $("#txtSearch_CreatedBy").val('');
            $("#hdnSelectedEmpName_CreatedBy").val('');
        },
        initializePageControls: function () {
            WFOHistoricalDashboard.clearWhoAboutValues();
            WFOHistoricalDashboard.clearWhoCreatedValues();
            WFOHistoricalDashboard.initializeDateControls();
            $txtStartDate.datepicker('setDate', 'today');
            $txtEndDate.datepicker('setDate', 'today');
            WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
            WFOHistoricalDashboard.ResizeSearchControls();
        },
        initializeDateControls: function () {
            var nowTemp = new Date();
            var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
            var startDt = "";

            $txtStartDate.datepicker({
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

            $txtEndDate.datepicker({
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
        ResizeSearchControls: function () {
            var divContainerWidth = $("#divEmpSearchFormGroup").width();
            var reducedWidth = (divContainerWidth * 72) / 100;
            var reducedTextBoxWidth = (reducedWidth * 70) / 100;
            $("#pageContent_search").width(reducedWidth);
            $("#txtSearch").width(reducedTextBoxWidth);
            $("#pageContent_createdBySearch").width(reducedWidth);
            $("#txtSearch_CreatedBy").width(reducedTextBoxWidth);
        },
        initializeHistDashResultsDiv: function () {
            $divHistDashResults.empty();
        },
        employeeNameSelect: function (e, employeeID, employeeName, employeeNameAndTitle) {  // (e, EmployeeID) {            
            $("#searchEmpID").val(employeeID);
            $("#txtSearch").val($(e.target).text());
            WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
        },
        createdByNameSelect: function (e, employeeID, employeeName, employeeNameAndTitle) {
            $("#searchEmpID_CreatedBy").val(employeeID);
            $("#txtSearch_CreatedBy").val($(e.target).text());
            WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
        },
        showNoDataMessage: function (divControl) {
            if (($("#tblFrozenHeader").length < 1) && (($("#tblHistoricalDashBaord").html()!= undefined) && ($("#tblHistoricalDashBaord").html().trim().length <= 0))) {
                if ($("#divAlert").is(":visible")) {
                    $("#divAlert").remove();
                }
                divControl.append(WFOHistoricalDashboard.getNoDataMessageHtml());
            }
        },
        getNoDataMessageHtml: function () {
            return "<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; No Results - Please select all appropriate search terms and click View button to see the dashboard. </div>";
        },

        showHugeDataMessage: function (divControl) {
            if ($("#divAlert").is(":visible")) {
                $("#divAlert").remove();
            }
            divControl.append(WFOHistoricalDashboard.getHugeDataMessageHtml());
        },
        getHugeDataMessageHtml: function () {
            return "<div id=\"divAlert\" class=\"alert alert-warning\" role=\"alert\"><i class='glyphicon glyphicon-info-sign'></i>&nbsp; Too many records found. An incomplete subset is shown. Either narrow the transactional search or contact your system administrator for assistance. </div>";
        },

        exportHistDashboard: function () {
            var tblBodyHTML = $("#tblHistoricalDashBaord tbody").clone();
            var htmlToExport = [];
            var headerHTML = $("#tblHistoricalDashBaord thead").clone();            
            htmlToExport.push("<table>");
            htmlToExport.push("<thead>");            
            htmlToExport.push(headerHTML.html());
            htmlToExport.push("</thead>");
            htmlToExport.push("<tbody>");            
            htmlToExport.push($(tblBodyHTML[0]).html());
            htmlToExport.push("</tbody>");
            htmlToExport.push("</table>");
            var searchTopic = [];
            $("#ddlFormName option:selected").each(function() {
                searchTopic.push($(this).text());
            });

            // Build HTML for Search criteria
            var searchTableData = {
                "Search Topic": searchTopic.join(","), 
                "Who About": $("#txtSearch").val(),
                "EmpOrTeam": ($("#ddlEmporTeamAbt option:selected").text() == "Select") ? "" : $("#ddlEmporTeamAbt option:selected").text(),
                "Who Created": $("#txtSearch_CreatedBy").val(),
                "EmpOrTeam_CreatedBy": ($("#ddlEmporTeamCreatedBy option:selected").text() == "Select") ? "" : $("#ddlEmporTeamCreatedBy option:selected").text(),
                "DateType": $("#ddlDateGrouping option:selected").text(),
                "Start Date": $("#txtStartDate").val(),
                "End Date": $("#txtEndDate").val()
            };

            var searchCriteriaHTML = WFOHistoricalDashboard.buildSearchTableHTML(searchTableData);
            if (tblBodyHTML.find("tr").length > 0) {
                exportData.exportToExcel($("<div>").append(htmlToExport.join("")).html(), 0, wfoHistDashFileName, false, true, searchCriteriaHTML);
            }
            else {
                coachingDashboardShared.ShowFixedWarningMsg($(".pageFooter"), "No data is available to export.");
            }

            tblBodyHTML = null;
            headerHTML = null;
        },
        buildSearchTableHTML: function (searchTableData) {
            var searchCriteriaHTML = [];
            searchCriteriaHTML.push("<table><thead><tr><th>First Column</th><th>Second Column</th></tr></thead>");
            searchCriteriaHTML.push("<tbody>");

            for (var key in searchTableData) {
                if (searchTableData.hasOwnProperty(key)) {
                    searchCriteriaHTML.push("<tr><td>" + key + "</td><td>" + searchTableData[key] + "</td></tr>");
                }
            }
            searchCriteriaHTML.push("</tbody></table>");
            return $("<div>").append(searchCriteriaHTML.join("")).html();
        },
        viewButtonClick: function () {
            if (WFOHistoricalDashboard.validateFilters() == false)
                return;
            var searchTopic = $("#ddlFormName").val();
            var searchTopics = "";
            $(searchTopic).each(function () {
                searchTopics += $(this)[0] + "|";
            });            

            var employeeID = $("#searchEmpID").val();
            var empOrTeam = $("#ddlEmporTeamAbt").val();
            var createdByEmployeeID = $("#searchEmpID_CreatedBy").val();
            var createdByEmpOrTeam = $("#ddlEmporTeamCreatedBy").val();
            var dateType = $("#ddlDateGrouping").val();
            var startDate = $("#txtStartDate").val();
            var endDate = $("#txtEndDate").val();
            var parms = $("#hdnParms").val();
            WFOHistoricalDashboard.getFormHistoricalData(searchTopics.substr(0, searchTopics.length - 1), employeeID, empOrTeam, createdByEmployeeID, createdByEmpOrTeam, startDate, endDate, dateType, $("#hdnParms").val());
            //WFOHistoricalDashboard.getFormHistoricalData('7', '-1', 'E', '1537127', 'E', '01/01/2014', '01/01/2017', 'Y', $("#hdnParms").val());

        },
        validateFilters: function () {
            //var selectedDateGroup = $("#ddlDateGrouping option:selected").val();
            var selectedStartDate = $txtStartDate.val();
            var selectedEndDate = $txtEndDate.val();
            var searchTopic = $("#ddlFormName").val();
            var selectedEmporTeam = $("#ddlEmporTeamAbt option:selected").val();
            var selectedCreatedByEmporTeam = $("#ddlEmporTeamCreatedBy option:selected").val();

            if (searchTopic.length == 0) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select a form.");
                return false;
            }

            if ($.trim($txtSearch.val()).length != 0 && selectedEmporTeam == -1) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select Employee or Team of Who About");
                return false;
            }

            if ($.trim($txtSearchCreatedBy.val()).length != 0 && selectedCreatedByEmporTeam == -1) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select Employee or Team of Created by.");
                return false;
            }

            //if (selectedDateGroup.length == 0) {
            //    coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select date grouping option.");
            //    return false;
            //}

            if ($.trim(selectedStartDate).length == 0) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select start date.");
                return false;
            }

            if (!isValidDate(selectedStartDate)) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Start date is not valid.");
                return false;
            }

            if (new Date(selectedStartDate).valueOf() > new Date().valueOf()) {
                coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Start date can not be later than Today's date.");
                return false;
            }

            if ($divEndDate.is(":visible")) {
                if ($.trim(selectedEndDate).length == 0) {
                    coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Please select end date.");
                    return false;
                }

                if (!isValidDate(selectedEndDate)) {
                    coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "End date is not valid.");
                    return false;
                }

                if (new Date(selectedStartDate).valueOf() > new Date(selectedEndDate).valueOf()) {
                    coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "Start date can not be later than End date.");
                    return false;
                }

                if (new Date(selectedEndDate).valueOf() > new Date().valueOf()) {
                    coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), "End date can not be later than Today's date.");
                    return false;
                }
            }
        },
        getFormHistoricalData: function (searchTopic, employeeID, empOrTeam, createdByEmployeeID, createdByEmpOrTeam, startDate, endDate, dateType, pageParms) {
            coachingDashboardShared.ShowLoadingModal();
            var inputData = {
                FormIDs: searchTopic,
                EmployeeID: employeeID,
                EmpOrTeamAbout: empOrTeam,
                CreatedByEmpID: createdByEmployeeID,
                EmpOrTeamCreatedBy: createdByEmpOrTeam,
                DateType: dateType,
                StartDate: startDate,
                EndDate: endDate,
                encryptedParms: pageParms
            };
            var parms = JSON.stringify(inputData);
            coachingDashboardShared.CallService(getFormHistoricalDataAPI, parms, WFOHistoricalDashboard.getFormHistoricalDataSuccess, WFOHistoricalDashboard.getFormHistoricalDataError);
        },
        getFormHistoricalDataSuccess: function (msg) {
            //msg.HistDashResults
            $divHistDashResults.empty();
            var HistDashResultsHtml = [];            
            if (msg.WFOHistDashResults.length <= 0) {
                WFOHistoricalDashboard.initializeHistDashResultsDiv();
                WFOHistoricalDashboard.showNoDataMessage($divHistDashResults);
                $("#spanTotalRecords").text(msg.WFOHistDashResults.length);
                $("#divTotalRecords").show();
            }
            else {
                if (msg.WFOHistDashResults.length > 1999) {
                    WFOHistoricalDashboard.initializeHistDashResultsDiv();
                    WFOHistoricalDashboard.showHugeDataMessage($divHistDashResults);
                }

                $("#spanTotalRecords").text(msg.WFOHistDashResults.length);
                $("#divTotalRecords").show();

                var columnNamesWith_array = Object.keys(msg.WFOHistDashResults[0]);
                var columnNames = columnNamesWith_array.map(function (element) {
                    return element.replace(/_/g, ' ');
                });

                HistDashResultsHtml.push('<table class="table table-bordered tblHistoricalDashboard" id ="tblHistoricalDashBaord">');
                HistDashResultsHtml.push("</table>");
                $divHistDashResults.append(HistDashResultsHtml.join(""));

                $("#tblHistoricalDashBaord").html("");
                $("#tblHistoricalDashBaord").trigger('destroy', false);
                $("#tblHistoricalDashBaord").removeClass('tablesorter');
                $("#tblHistoricalDashBaord").append(
                        WFOHistoricalDashboard.getHistDashDataHeaderRow(columnNames));
                $("#tblHistoricalDashBaord").append(WFOHistoricalDashboard.getHistDashDataTable(msg.WFOHistDashResults, columnNamesWith_array));

                $('#tblHistoricalDashBaord').tablesorter({
                    showProcessing: true,
                    headerTemplate: '{content} {icon}',
                    //headers: { 0: { sorter: false, filter: false } },
                    //widgets: ['zebra', 'filter', 'scroller'],
                    widgets: ['zebra', 'scroller'],
                    widgetOptions: {
                        // scroll tbody to top after sorting
                        scroller_upAfterSort: true,
                        // pop table header into view while scrolling up the page
                        scroller_jumpToHeader: true,
                        //scroller_height: divHeight - 50,
                        // set number of columns to fix
                        scroller_fixedColumns: 0,
                        // add a fixed column overlay for styling
                        scroller_addFixedOverlay: false,
                        // add hover highlighting to the fixed column (disable if it causes slowing)
                        scroller_rowHighlight: 'hover',

                        // bar width is now calculated; set a value to override
                        scroller_barWidth: null,
                        filter_reset: ".reset",
                        filter_cssFilter: "form-control",
                        // include child row content while filtering, if true
                        filter_childRows: false,
                        // search from beginning
                        filter_startsWith: false,
                        // Set this option to false to make the searches case sensitive
                        filter_ignoreCase: true
                    }
                });

                $('#tblHistoricalDashBaord').trigger('sortReset');
                
                //var divHeight = $('.tablesorter-scroller-table').height();
                var divHeight = $($(".whitepage")[0]).height() - $($(".searchNav")[0]).height() - $($(".historicalPageHeader")[0]).height() - $($(".pageFooter")[0]).height() - 100;
                WFOHistoricalDashboard.updateScroller(divHeight);

                for (var i = 1; i < columnNamesWith_array.length; i++) {
                    var tdList = $("table.tblHistoricalDashboard td:nth-child(" + i + ")");
                    var spanList = $("table.tblHistoricalDashboard td:nth-child(" + i + ") span");
                    var tdNormalWideClass = tdList.filter('.tdNormalWide');
                    var tdMoreWideClass = tdList.filter('.tdMoreWide');
                    var spanNormalWideClass = spanList.filter('.spanNormalWide');
                    var spanMoreWideClass = spanList.filter('.spanMoreWide');
                    if (tdNormalWideClass.length > tdMoreWideClass.length) {
                        tdMoreWideClass.removeClass('tdMoreWide').addClass('tdNormalWide');
                        spanMoreWideClass.removeClass('spanMoreWide').addClass('spanNormalWide');

                    } else {
                        tdNormalWideClass.removeClass('tdNormalWide').addClass('tdMoreWide');
                        spanNormalWideClass.removeClass('spanNormalWide').addClass('spanMoreWide');
                    }
                }                

                //$('#tblHistoricalDashBaord tr').mouseenter(function () {
                //    var row = $(this);
                //    $(this).find("td > span").addClass('histDashTableMoreTextExpanded');
                //});
                //$('#tblHistoricalDashBaord tr').mouseleave(function () {
                //    var row = $(this);
                //    $(this).find("td > span").removeClass('histDashTableMoreTextExpanded');
                //});
                //$('[data-toggle="popover"]').popover();
                $('[data-toggle="tooltip"]').tooltip({
                    container: 'body'
                });
                $('.tt_large').tooltip({
                    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="large-tooltip-inner"></div></div>',
                    container: 'body'
                });
            }
            coachingDashboardShared.RemoveLoadingModal();
        },
        getHistDashDataHeaderRow: function (columnNames) {
            var thHtml = [];

            for (var i = 0; i < columnNames.length; i++) {
                thHtml.push('<th><div class="">' + columnNames[i] + "</div></th>");
            }
            var headerHtml = "<thead>" +
                                '<tr class="">' +
                                    thHtml.join("") +
                                "</tr>" +
                             "</thead>";

            return headerHtml;
        },
        getHistDashDataTable: function (HistDashResults, columnNames) {
            var trHtml = [];
            for (var i = 0; i < HistDashResults.length; i++) {
                trHtml.push('<tr class="trToBeExpandedOnHover">');
                for (var j = 0; j < columnNames.length; j++) {
                    var value = HistDashResults[i][columnNames[j]];

                    if (((columnNames[j].indexOf("Date") != -1) || (columnNames[j].indexOf("DATE") != -1)) && Date.parse(value)) {
                        // Value is of DateType & change the format
                        var newDate = new Date(value);
                        //value = newDate.getFullYear() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getDate();
                        value = newDate.getFullYear() + '-' + ((newDate.getMonth() + 1 < 10) ? '0' + (newDate.getMonth() + 1) : (newDate.getMonth() + 1)) +
                            '-' + ((newDate.getDate() < 10) ? '0' + newDate.getDate() : newDate.getDate());

                    }

                    var tdclassName = "";
                    var spanClassName = "";

                    if (value != undefined && value.length > 100) {
                        tdclassName = "tdMoreWide";
                        spanClassName = "spanMoreWide";
                    }
                    else {
                        tdclassName = "tdNormalWide";
                        spanClassName = "spanNormalWide";
                    }

                    value = (value == null || value == "null" || value == "(null)") ? "" : value;
                    var $holder = $('<div>');
                    $holder.append(value);
                    var valueWithoutHTML = $holder.find('p').text();
                    var result = (valueWithoutHTML == '') ? value : valueWithoutHTML;
                    spanClassName = (result.length > 50) ? spanClassName + ' tt_large' : spanClassName;

                    var spanText = '<span data-toggle="tooltip" data-placement="bottom" class="' + spanClassName + '" title = "' + result
                                         + '">' + result + '</span>';
                    var spanContent = result.startsWith('<table ') ? WFOHistoricalDashboard.checkTableHTML(result) : spanText;

                    var tdHtml = '<td class="' + tdclassName + '">' + spanContent
                                       + "</td>";

                    //var tdHtml = '<td class="' + tdclassName + '">' +
                    //                                      '<span data-toggle="popover" title="details" class="' + spanClassName + '" data-content = "' + result
                    //                                         + '">' + result + '</span>' +
                    //                                  "</td>";
                    trHtml.push(tdHtml);
                }
                trHtml.push("</tr>");                
            }

            var dataTableHtml = '<tbody style="">' +
                                        trHtml.join("") +
                                "</tbody>";

            return dataTableHtml;
        },
        checkTableHTML : function(html) {
            var doc = document.createElement('div');
            doc.innerHTML = html;            
            return (doc.innerHTML === html) ? html : '';
        },
        getFormHistoricalDataError: function (msg) {
            coachingDashboardShared.RemoveLoadingModal();
            coachingDashboardShared.ShowFixedErrorMsg($(".pageFooter"), msg);
        },
        updateScroller: function (height) {
            $('.tablesorter-scroller-table').css({
                height: '',
                'max-height': height + 'px'
            });
        }
    }
})();
