console.log("Main called");

document.addEventListener("DOMContentLoaded", event => {
    $("#main").hide();
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
    getCurrentEvent()
    .then(event => {
        $("#current-event").text($("#current-event").text() + event);
        setUpMatchOptions();
    })
   
}

/**
 * Displays matches at event and then begins to set up teams
 */
async function setUpMatchOptions()
{
    getMatches()
    .then(matches =>{
        for (match of matches)
            $("#match-choices").append(getMatchOption(match));
    })
    $("#match-choices").on("change", function () {
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
    $("#team-choices").html("<option disabled selected value> -- select an option -- </option>");

    getTeamsInMatch(match)
    .then(teamData => {
        for (i in teamData.teams)
            $("#team-choices").append(getTeamOption(teamData.teams[i], i, teamData.id));
    })
    // Resets and reveals the form when a new team is selected
    $("#team-choices").on("change", function(){
        reset();
        $("#main").show();
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
 * Returns the data inputted by the user for the match
 */
function getInputtedData()
{

    var data = getEmptyMatchData();
    data.matchId = $("#team-choices option:selected").attr("data-id");
    data.team = $("#team-choices option:selected").text();
    data.match = $("#match-choices option:selected").text();

    $(".data").each(function (index, obj){
        var path = $(this).attr("id").split("-");
        var temp = data;
        for(i = 0; i < path.length - 1; i ++)
            temp = temp[path[i]];

        if ($(this).hasClass("form-check-input"))
            temp[path[i]] = $(this).is(':checked') ? 1 : 0;
        else if ($(this).parent().hasClass("btn"))
            temp[path[i]] = $(this).parent().hasClass("active") ? 1 : 0;
        else
            temp[path[i]] = parseInt($(this).text().trim());
    })
    if ($("#auto-position-2").prop("checked"))
        data.auto.position = 2;
    return data;
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
            oneDeliverStone: 0,
            oneDeliverSkystone: 0,
            twoDeliverStone: 0,
            twoDeliverSkystone: 0,
            extraDelivers: 0,
            placed: 0,
            position: 0,
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
    $(".btn-group").each(function() {
        $(this).children(".btn").eq(0).trigger("click");
    })

    // $("#auto-position-1").parent().addClass("active");
    // $("#auto-position-2").parent().removeClass("active");
    $(".form-control").each(function (index, obj) {
        $(this).text(0);
    })

    $(".form-check-input").each(function (index, obj){
        $(this).prop('checked', false);
    })
    $("#capstone-info").addClass("disappear");
}
