console.log("Main called");

document.addEventListener("DOMContentLoaded", event => {
    $("#main").hide();
    $("#capstone-info").hide();
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
    $("#end-capstone_placed").on("click", function(){
       if(this.checked)
            $("#capstone-info").show();
        else
        {
           $("#capstone-info").hide();
           $("#end-capstone_height").text(0);
        }
   })
    $("#submit-btn").on("click", saveData);
})

/**
 * Sets which event is being scoutted ands sets up matches
 */
function setUpEvent() {
    getCurrentEvent()
        .then((event) => {
            $("#current-event").text($("#current-event").text() + event);
            setUpMatchOptions()
        })
}

/**
 * Sets up each match option for the event
 */
function setUpMatchOptions() {
    getMatches()
        .then((matches) => {
            for (match of matches)
                $("#match-choices").append(getMatchOption(match));

            // Whenever the selected match changes, set up the team options for that match
            $("#match-choices").on("change", function () {
                setUpTeamOptions($("#match-choices option:selected").text());
                $("#main").hide();
            })
        })
}

/**
 * Sets up team options for the given match
 * 
 * @param {String} match - The match number to be scoutted
 */
function setUpTeamOptions(match) {
    getTeamsInMatch(match)
        .then((teams) => {

            //default state
            $("#team-choices").html("<option disabled selected value> -- select an option -- </option>");
            $("#team-choices").removeClass("text-white");
            $("#team-choices").css("background-color", "")

            // add choices
            for (team of teams.blue)
                $("#team-choices").append(getTeamOption(team, "blue"));
            for (team of teams.red)
                $("#team-choices").append(getTeamOption(team, "red"));

            // Resets and reveals the form when a new team is selected
            $("#team-choices").on("change", function () {
                if ($("option:selected", this).hasClass("blue"))
                    $(this).css("background-color", "blue")
                else
                    $(this).css("background-color", "red")
                $(this).addClass("text-white");
                reset();
                $("#main").show();
            })
        })
}

/**
 * Returns the html for a match option for the given match
 * 
 * @param {String} match - the match to make into an option
 */
function getMatchOption(match) {
    return `<option>${match}</option>`;
}

/**
 * Returns the html for a team option for the given team
 * @param {String} team - the team to make into an option
 * @param {String} color - the team's alliance color
 */
function getTeamOption(team, color) {
    return `<option class = "${color}">${team}</option>`
}

/**
 * Returns the data inputted by the user for the match
 */
function getInputtedData() {
    return getEmptyMatchData()
    .then(data => {
        data.match = $("#match-choices option:selected").text();
        data.team = $("#team-choices option:selected").text();
        $(".data").each(function (index, obj){
            var path = $(this).attr("id").split("-");
            var temp = data.gamePlay;
            for(i = 0; i < path.length - 1; i ++)
                temp = temp[path[i]];

            if ($(this).hasClass("form-check-input"))
                temp[path[i]] = $(this).is(':checked') ? 1 : 0;
            else if ($(this).parent().hasClass("btn"))
                temp[path[i]] = $(this).parent().hasClass("active") ? 1 : 0;
            else
                temp[path[i]] = parseInt($(this).text().trim());
        })
        return data;
    })
}


/**
 * Resets the whole form
 */
function reset()
{
    $(".btn-group").each(function() {
        $(this).children(".btn").eq(0).trigger("click");
    })

    $(".form-control").each(function (index, obj) {
        $(this).text(0);
    })
    $(".form-check-input").each(function (index, obj){
        $(this).prop('checked', false);
    })
    $("#capstone-info").hide();
}
