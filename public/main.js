console.log("Main called");
var autoDeliveryStoneOptions = 0;
var autoPlaceStoneOptions = 0;
var choices = ["None", "Stone", "Skystone" ];

document.addEventListener("DOMContentLoaded", event => {
    $("#main").hide();
    addAutoDeliveryStoneOption();
    addAutoPlaceStoneOption();
    setUpEvent();

    // Sets up the increment/decrement features of the +/- options
    $(".change-btn").on("click", function(){
       console.log("clicked")
       var id = $(this).attr("for");
       var val = parseInt($("#" + id).text());
       if($(this).hasClass("increment"))
            $("#" + id).text(val + 1);
        else if(val > 0)
           $("#" + id).text(val - 1);
   })
    $("#teleop-capstone-placed").on("click", function(){
       if(this.checked)
            $("#capstone-info").removeClass("disappear");
        else
        {
           $("#capstone-info").addClass("disappear");
           $("#teleop-capstone-height").text(0);
        }
   })
   $("#submit-btn").on("click", saveData);
})

/**
 * Displays the Scouting event and begins to set up matches
 */
async function setUpEvent()
{
    var event = await getCurrentEvent();
    $("#current-event").text($("#current-event").text() + event);
    setUpMatchOptions();
}

/**
 * Displays matches at event and then begins to set up teams
 */
async function setUpMatchOptions()
{
    var matches = await getMatches();
    for(match of matches)
        $("#match-choices").append(getMatchOption(match));
    $("#match-choices").on("change", function(){
        console.log($("#match-choices option:selected").text())
        setUpTeamOptions($("#match-choices option:selected").text());
        $("#main").hide();
    })
}

/**
 * Displays the teams in the inputted match
 * @param {String} match - the match to get teams for
 */
async function setUpTeamOptions(match)
{
    var teamData = await getTeamsInMatch(match);
    $("#team-choices").html("<option disabled selected value> -- select an option -- </option>");
    console.log(teamData);
    for(i in teamData.teams)
        $("#team-choices").append(getTeamOption(teamData.teams[i], i , teamData.id));
    // Resets and reveals the form when a new team is selected
    $("#team-choices").on("change", function(){
        reset();
        $("#main").show();;
    })
}

/**
 * Returns the html for a match options
 * @param {String} match - the match number
 */
function getMatchOption(match)
{
    return `<option>${match}</option>`;
}

/**
 * Returns the html for a team option
 * @param {*} team - the team number
 * @param {*} i - their number within the match
 * @param {*} match - their match
 */
function getTeamOption(team, i, match)
{
    var id = (parseInt(match) - 1)*4 + parseInt(i);
    return `<option data-id = "${id}">${team}</option>`;
}

/**
 * Adds a placed stone option in auto, and binds the buttons to this function
 * @param {*} button - a new placed stone option
 */
function addAutoPlaceStoneOption(button)
{
    if (autoPlaceStoneOptions >= 6)
        return;
    $(button).unbind();
    autoPlaceStoneOptions++;
    var $option = getAutoOption(autoPlaceStoneOptions, "auto-placement")
    $option.on("click", function(){addAutoPlaceStoneOption(this)});
    $("#auto-placement-stones").append($option);
}

/**
 * Adds a delivered stone option in auto, and binds the buttons to this function
 * @param {*} button - a new delivered stone option
 */
function addAutoDeliveryStoneOption(button)
{
    if(autoDeliveryStoneOptions >= 6)
        return;
    $(button).unbind();
    autoDeliveryStoneOptions++;
    var $option = getAutoOption(autoDeliveryStoneOptions, "auto-delivery")
    $option.on("click", function(){addAutoDeliveryStoneOption(this)});
    $("#auto-delivery-stones").append($option);
}

/**
 *  Returns the buttons for stone choices in auto
 * @param {*} number - value from 1 to 6
 * @param {*} className - class to differientiate between delivery and placement
 */
function getAutoOption(number, className)
{
    return $(`
        <div class = "btn-toolbar pt-3">
            <h4 class = "pt-1 pr-3">Stone ${number}.</h4>
            <div data-stone = "${number}" class = "btn-group btn-group-toggle auto-choices ${className}" data-toggle="buttons">
                <label class="btn btn-outline-primary active">
                    <input type="radio" name="options" autocomplete="off" checked>${choices[0]}</label>
                <label class="btn btn-outline-primary">
                    <input type="radio" name="options" autocomplete="off">${choices[1]}</label>
                <label class="btn btn-outline-primary">
                    <input type="radio" name="options" autocomplete="off">${choices[2]}</label>
            </div>
        </div>
        `)
}

/**
 * Returns the data inputted by the user for the match
 */
function getInputtedData()
{

    var data = getEmptyMatchData();
    data.matchId = $("#team-choices option:selected").attr("data-id");
    data.team = $("#team-choices option:selected").text();
    data.match = $("#match-choices option:selected").text();
    getAutoChoices(data, "delivery");
    getAutoChoices(data, "placement");
    $(".data").each(function (index, obj){
        var path = $(this).attr("id").split("-");
        var temp = data;
        for(i = 0; i < path.length - 1; i ++)
            temp = temp[path[i]];
        if ($(this).hasClass("form-check-input"))
            temp[path[i]] = $(this).is(':checked') ? 1 : 0;
        else
            temp[path[i]] = parseInt($(this).text().trim());
    })
    if ($("#auto-position-2").prop("checked"))
        data.auto.position = 2;
    return data;
}

/**
 * Stores the values of the auto choices, as clicked by the user
 * @param {*} data - the storage object for all user inputs
 * @param {*} className - which auto choice to look through
 */
function getAutoChoices(data, className)
{
    $(".auto-" + className + " > .btn.active").each(function (index, obj) {
        for (var i = 0; i < choices.length; i++)
            if ($(obj).text().trim() == choices[i])
                data.auto[className][index] = i;
    })
}

/**
 * Returns an empty storage object for user inputs
 */
function getEmptyMatchData()
{
    return {
        matchId: "",
        team: "",
        match: "",
        auto: {
            delivery: new Array(6).fill(0),
            placement: new Array(6).fill(0),
            position: 1,
            foundation: 0,
            parked: 0
        },
        teleop: {
            delivery: 0,
            placed: 0,
            capstone: {
                placed: 0,
                height: 0
            },
            foundation: 0,
            parked: 0
        }
    }
}

/**
 * Resets the whole form
 */
function reset()
{
    console.log("reset called");
    $("#auto-delivery-stones").html("");
    autoDeliveryStoneOptions = 0;
    $("#auto-placement-stones").html("");
    autoPlaceStoneOptions = 0;
    addAutoDeliveryStoneOption();
    addAutoPlaceStoneOption();
    $("#auto-position-1").parent().addClass("active");
    $("#auto-position-2").parent().removeClass("active");
    $(".form-control").each(function (index, obj) {
        $(this).text(0);
    })

    $(".form-check-input").each(function (index, obj){
        $(this).prop('checked', false);
    })
    $("#capstone-info").addClass("disappear");
}
