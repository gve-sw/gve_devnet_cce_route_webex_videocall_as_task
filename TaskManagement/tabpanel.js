var currentTab;
//initilize tabs
var count = 0;

$(function () {

    //when ever any tab is clicked this method will be call
    $("#myTab").on("click", "a", function (e) {
        e.preventDefault();

        $(this).tab('show');
        $currentTab = $(this);
    });

    //registerComposeButtonEvent();
    registerCloseEvent();
});

function showAlert(containerId, alertType, message) {
    $("#" + containerId).append('<div class="alert alert-' + alertType + '" id="alert' + containerId + '">' + message + '</div>');
    $("#alert" + containerId).alert();
    window.setTimeout(function () { $("#alert" + containerId).alert('close'); }, 2000);
}

//this method will register event on close icon on the tab..
function registerCloseEvent() {

    $(".closeTab").click(function () {

        //there are multiple elements which has .closeTab icon so close the tab whose close icon is clicked
        var tabContentId = $(this).parent().attr("href");
        $(this).parent().parent().remove(); //remove li of tab
        $('#myTab a:last').tab('show'); // Select first tab
        $(tabContentId).remove(); //remove respective tab content

    });
}

//shows the tab with passed content div id..paramter tabid indicates the div where the content resides
function showTab(tabId) {
    $('#myTab a[href="#' + tabId + '"]').tab('show');
}
//return current active tab
function getCurrentTab() {
    return currentTab;
}

//This function will create a new tab here and it will load the url content in tab content div.
function createNewTab(dialogId) {
        var tabId = "tab_" + dialogId; //this is id on tab content div where the 
        
        //$('.nav-tabs').append('<li><a href="#' + tabId + '"><button class="close closeTab" type="button" >x</button> Dialog_' + dialogId +'</a></li>');
        $('.nav-tabs').append('<li><a href="#' + tabId + '">Dialog_' + dialogId +'</a></li>');

        //create tab from template and append to tab-content
        var template = $('#dialog-tabpane-template').html();
        $('.tab-content').append(template);
        var tabpane = $("#newTab");
        $(tabpane).attr("id", tabId);

        //set id for table and allowable actions div
        tabpane.find("#dialogId").text(dialogId);
        tabpane.find(".dialog-state").attr("id", "dialogState_" + dialogId);
        tabpane.find(".customer-details").attr("id", "customer_details_" + dialogId);
        tabpane.find(".allowable-actions").attr("id", "allowableActions_" + dialogId);
		tabpane.find(".webex-instant").attr("id", "webex_instant_" + dialogId);

        $(this).tab('show');
        showTab(tabId);
        registerCloseEvent();
        count++;
}

//this will return element from current tab
//example : if there are two tabs having  textarea with same id or same class name then when $("#someId") whill return both the text area from both tabs
//to take care this situation we need get the element from current tab.
function getElement(selector) {
    var tabContentId = $currentTab.attr("href");
    return $("" + tabContentId).find("" + selector);

}

function getTabCount() {
    return count;
}


function removeCurrentTab(dialogId) {
    var ctab;
    if(dialogId) {
       ctab = $('#myTab a[href="#tab_' + dialogId + '"]')
    } else {
        ctab = $currentTab;
    }
   
    var tabContentId = ctab.attr("href");
    ctab.parent().remove(); //remove li of tab
    $('#myTab a:last').tab('show'); // Select first tab
    $(tabContentId).remove(); //remove respective tab content
    count--;

    if(count <= 0) {
        $( ".tabbable" ).css( "display", "none" );
    }
}
