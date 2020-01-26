/**
 * Returns the current event to scout for
 */
async function getCurrentEvent()
{
    return $.get('/getCurrentEvent', (event) => {
        return event;
    })
}

/**
 * Returns the matches in the current event
 */
async function getMatches()
{
    return $.get('/getMatches', (matches) => {
       return matches
    })
}

/**
 * Returns the teams for the given match
 * @param {*} match - the match to get teams from
 */
async function getTeamsInMatch(match)
{
    return $.get('/getTeamsInMatch?match=' + match, (teams) => {
        return teams
    })
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