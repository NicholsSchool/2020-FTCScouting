
async function getExistingEvents() {
    //TODO: Create server side code to get existing events
    var events;
    await $.get('/getAllEvents', (response) => {
        events = response
    })
    return events;
}

async function getTeamsInEvent(event) {
    //TODO: Create server side code to get event's teams
    var teams;
    await $.get('/getTeamsInEvent?event=' + event, (response) => {
        teams = response
    })
    return teams;
    //return ["12736", "12737", "12345", "78232", "12893", "9821"]
}

async function getMatchesInEvent(event) {
    //TODO: Create server side code to get event's teams
    var matches;
    await $.get('/getMatchesInEvent?event=' + event, (response) => {
        console.log("Getting match stuf")
        console.log(response);
        matches = response[0];
    })
    console.log(matches)
    return matches;
    //return [["12736", "12737", "12345", "78232"], ["12893", "9821", "12345", "12736"]];
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

async function setEvent() {
    if (eventError())
        return;

    await $.post('/setEvent', { "event": getUserInputtedEventName() },
        function (response, status) {
            console.log(response);
            $('#set-event-btn').addClass("disappear");
        })

}