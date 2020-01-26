
async function getExistingEvents() {
    return $.get('/getAllEvents', (events) => {
       return events
    })
}

async function getTeamsInEvent(event) {
    return $.get('/getTeamsInEvent?event=' + event, (teams) => {
        return teams;
    })
}

async function getMatchesInEvent(event) {
  
    return $.get('/getMatchesInEvent?event=' + event, (matches) => {
        return matches;
    })
}

function saveTeamsToServer() {
    console.log("testing server");
    var data = {}
    data["event"] = getUserInputtedEventName();
    data["teams"] = teams;
    $.post('/saveTeams', data,
        function (response, status) {
            console.log(response);
        })
}

function saveMatchesToServer() {
    console.log("saving matches");
    var data = {}
    data["event"] = getUserInputtedEventName();
    data["matches"] = matches;
    $.post('/saveMatches', data,
        function (response, status) {
            console.log(response);
        })
}

function setTeamsInSpreadsheet(){
    $.post('/saveTeamsToSpreadsheet', {},
        function (response, status) {
            console.log(response);
        })
}

function setMatchesInSpreadsheet() {
    $.post('/saveMatchesToSpreadsheet', {},
        function (response, status) {
            console.log(response);
        })
}

async function setEvent() {
    if (eventError())
        return;

    $.post('/setEvent', { "event": getUserInputtedEventName() },
        function (response, status) {
            console.log(response);
            $('#set-event-btn').addClass("disappear");
        })

}