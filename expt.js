var exportData = (function () {
    var excelExportAPI = baseURL + "Services/Excel.ashx";
    var pdfExportAPI = baseURL + "Services/pdf.ashx";

    return {
        exportToExcel: function (html, columns, title, includeCustomAttributesForHeader, includeSearchCriteria, searchCriteriaHTML) {            
            exportData.getExcelFile(html, columns, title, includeCustomAttributesForHeader, includeSearchCriteria, searchCriteriaHTML);
        },

        getExcelFile: function (html, columns, title, includeCustomAttributesForHeader, includeSearchCriteria, searchCriteriaHTML) {            
            if (html.length > 0) {
                try {
                    if ($("#frmExcelExport").length == 0) {
                        var form = document.createElement("form");
                        form.action = excelExportAPI;
                        form.name = "frmExcelExport";
                        form.id = "frmExcelExport";
                        form.method = "post";
                        form.target = "_self";
                        $("body").append(form);
                        $("<input type='hidden' name='exportParms' id='exportParms' />").appendTo("#frmExcelExport");
                        $("<input type='hidden' name='viewState' id='viewState' />").appendTo("#frmExcelExport");
                    }
                    //var data = '{"html": "' + escape(html) + '","title": "' + title + '","columns": "' + columns + '","includeCustomAttributesForHeader": "' + includeCustomAttributesForHeader + '"}';
                    var data = {};
                    if (includeSearchCriteria != undefined && includeSearchCriteria != null && includeSearchCriteria)
                        data = {
                            html: escape(html),
                            title: title,
                            columns: columns,
                            includeCustomAttributesForHeader: includeCustomAttributesForHeader,
                            includeSearchCriteria: includeSearchCriteria,
                            searchCriteriaHTML: escape(searchCriteriaHTML)
                        };
                    else {
                        data = {
                            html: escape(html),
                            title: title,
                            columns: columns,
                            includeCustomAttributesForHeader: includeCustomAttributesForHeader
                        };
                    }
                    $("#exportParms").val(JSON.stringify(data));
                    $("#viewState").val($("#hdnViewState").val());
                    document.frmExcelExport.submit();
                    $("#exportParms").val("");
                    $("#viewState").val("");
                }
                catch (e) {
                    alert("Error - Unable to export");
                }
            }
        },

        getExcelFileSuccess: function (msg) {
            RemoveLoadingModal();
        },

        exportToPdf: function (title1, title2, fileName) {
            var html = [""];
            $(".pageExport").each(function () {
                html.push($(this).html());
            });
            if (html.length > 1) {
                exportData.getPdfFile(html.join("<br />"), title1, title2, fileName);
            }
        },

        getPdfFile: function (html, title1, title2, fileName, addDraftWatermark) {
            if (html.length > 0) {
                if ($("#frmExcelExport").length == 0) {
                    var form = document.createElement("form");
                    form.action = pdfExportAPI;
                    form.name = "frmExcelExport";
                    form.id = "frmExcelExport";
                    form.method = "post";
                    form.target = "_self";
                    $("body").append(form);
                    $("<input type='hidden' name='exportParms' id='exportParms' />").appendTo("#frmExcelExport");
                    $("<input type='hidden' name='viewState' id='viewState' />").appendTo("#frmExcelExport");
                }
                if (!addDraftWatermark) {
                    addDraftWatermark = false;
                }
                var data = '{"html": "' + escape(html) + '","title1": "' + title1 + '","title2": "' + title2 + '","fileName": "' + fileName + '","draftWatermark": "' + addDraftWatermark + '"}';
                $("#exportParms").val(data);
                $("#viewState").val($("#hdnViewState").val());
                document.frmExcelExport.submit();
                $("#exportParms").val("");
                $("#viewState").val("");
            }
        }

    }

})();
