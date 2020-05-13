/**
 * Returns the current event being scoutted
 * 
 * @return the current event being scoutted
 */
async function getCurrentEvent() {
    return $.get('/getCurrentEvent', (event) => {
        return event;
    })
}

/**
 * Returns the ID of the current event being scoutted
 * 
 * @return the ID of the current event being scoutted
 */
async function getCurrentEventID() {
    return $.get('/getCurrentEventID', (eventID) => {
        return eventID;
    })
}

/**
 * Returns a list of all teams in the current event
 * 
 * @return a list of all teams in the current event
 */
async function getAllTeams() {
    return $.get('/getAllTeams', (teams) => {
        return teams;
    })
}

/**
 * Returns a list of all the match numbers in the current event
 * 
 * @return a list of all the match numbers in the current event
 */
async function getMatches() {
    return $.get('/getMatches', (matches) => {
        return matches;
    })
}

/**
 * Returns the alliances of teams for the given match
 * 
 * @param {String} match - the match number of the desired match
 * @return the alliances of teams for the given match
 */
async function getTeamsInMatch(match) {
    return $.get('/getTeamsInMatch?match=' + match, (teams) => {
        return teams;
    })
}

/**
 * Returns an empty storage object for the data being scoutted
 * 
 * @return an empty storage object for the data being scoutted
 */
async function getEmptyMatchData() {
    return $.get('/getEmptyData', (emptyData) => {
        return emptyData;
    })
}

/**
 * Returns a ranked list of teams and their average scores for a givin task
 * @param {String} path - the storage path for the desired task
 * @param {Number} numTeams - the number of teams to have in the list
 * @param {Boolean} isReversed - true if ranked list should be reversed, false otherwise
 */
async function getRankings(path, numTeams, isReversed) {
    console.log("Is reversed: " + isReversed);
    return $.get('/getRanking?path=' + path + '&numTeams=' + numTeams + "&isReversed=" + isReversed, (data) => {
        return data;
    })
}

/**
 * Saves the data that was scoutted and resets the form
 */
function saveData() {
    getInputtedData()
        .then((data) => {
            $.post('/saveData', data);
            reset();
            $("#main").hide();
        })
}

/**
 * Returns the predicted scores of two alliances
 * 
 * @param {*} blueAlliance - a list of teams in the blue alliance
 * @param {*} redAlliance - a list of teams in the red alliance
 * @return the predicted scores of two alliances
 */
async function getPrediction(blueAlliance, redAlliance) {
    console.log("Getting Prediction")
    return $.get('/getWinner', { 'blue': blueAlliance, 'red': redAlliance }, (prediction) => {
        return prediction;
    })
}

/**
 * Returns the data stored for a given team 
 * @param {String} team - the team's number
 * @return the data stored for a given team
 */
async function getTeamData(team) {
    return $.get('/getTeamData', { 'team': team }, (teamData) => {
        return teamData;
    })
}

/**
 * Returns a list of the data for each and every team
 * @return a list of the data for each and every team
 */
async function getAllTeamData() {
    return $.get('/getAllTeamData', (allTeamData) => {
        return allTeamData
    })
}