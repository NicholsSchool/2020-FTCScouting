/**
 * Returns the current event to scout for
 */
async function getCurrentEvent()
{
    var event;
    await $.get('/getCurrentEvent', (response) => {
        event = response
    })
    return event
}

/**
 * Returns the matches in the current event
 */
async function getMatches()
{
    var matches;
    await $.get('/getMatches', (response) => {
        matches = response
    })
    return matches
}

/**
 * Returns the teams for the given match
 * @param {*} match - the match to get teams from
 */
async function getTeamsInMatch(match)
{
    var teams;
    await $.get('/getTeamsInMatch?match=' + match, (response) => {
        teams = response
    })
    return teams
}

/**
 * Saves the user inputted data and resets the form
 */
function saveData() {
    console.log("Saving data");
    $.post('/saveData', {"data": getInputtedData()},
        function (response, status) {
            console.log(response);
        })
    reset();
    $("#main").hide();
}