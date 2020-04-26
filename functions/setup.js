const { app, db } = require('./server');
const gameData = require("./data");
/**
 * Saves the inputted teams for the inputted event
 * @param event - inside the request sent, this must be the desired event's name
 * @param teams = inside the request sent, this must be a list of the teams 
 */
app.post('/saveTeams', (req, res) => {
    var event = req.body.event;
    var teams = req.body.teams;
    var batch = db.batch();
    for (team of teams)
        batch.set(db.collection("Events").doc(event).collection("Teams").doc(team), {
            teamNum: team,
            matches: {},
            averages: gameData.getEmptyMatchData().gamePlay
        });
    batch.commit()
        .then(() => {
            res.send("done");
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})

/**
 * Saves the inputted matches for the inputted event
 * @param event - inside the request sent, this must be the desired event's name
 * @param teams = inside the request sent, this must be a list of the matches with their alliances 
 */
app.post("/saveMatches", (req, res) => {
    var event = req.body.event;
    var matches = req.body.matches;
    var batch = db.batch();
    for (match in matches) {
        var matchNum = "" + (Number(match) + 1);
        while (matchNum.length < 3)
            matchNum = "0" + matchNum;
        batch.set(db.collection("Events").doc(event).collection("Matches").doc(matchNum), matches[match]);
    }
    batch.commit()
        .then(() => {
            res.send("done");
        })
})

/**
 * Sets the inputted event as the current event
 * @param event - inside the request sent, this must be the desired event's name
 */
app.post("/setEvent", (req, res) => {
    db.collection("MetaData").doc("CurrentEvent").set({ event: req.body.event })
    db.collection("Events").doc(req.body.event).set({ name: req.body.event })
    res.send("All done");
})

/**
 * Returns the names of all events in database
 * @return the names of all events in database
 */
app.get("/getAllEvents", async (req, res) => {

    db.collection("Events").listDocuments()
        .then(docs => {
            var events = [];
            for (i in docs)
                events.push(docs[i].id);
            res.send(events);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })

})

/**
 * Returns all the matches, along with the teams in each match, for a given event
 * @param event - inside the request sent, this must be the desired event's name
 * @return all the matches, along with the teams in each match, for a given event
 */
app.get("/getDetailedMatches", async (req, res) => {
    var event = req.query.event;
    console.log(event);
    db.collection("Events").doc(event).collection("Matches").listDocuments()
        .then(docs => {
            return db.getAll(...docs)
        })
        .then(async docSnaps => {
            var matches = [];
            for (let docSnap of docSnaps)
                matches.push(await docSnap.data())
            res.send(matches);
        })
        .catch(err => {
            console.error(err)
            res.send(err);
        })
})

/**
 * Returns all the teams in the given event
 * @param event - inside the request sent, this must be the desired event's name
 * @return all the teams in the given event
 */
app.get("/getTeamsInEvent", async (req, res) => {
    var event = req.query.event;

    db.collection("Events").doc(event).collection("Teams").listDocuments()
        .then(docs => {
            var teams = [];
            for (team of docs)
                teams.push(team.id);
            res.send(teams);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        })
})