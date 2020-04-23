// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express')
const app = express()

//Firebase realtime database
const db = admin.firestore();

/*************************** START OF ADMIN SETUP CODE  ****************************/

/**
 * Saves the inputted teams for the inputted event
 */
app.post('/saveTeams',(req, res) => {
    var event = req.body.event;
    var teams = req.body.teams;
    var batch = db.batch();
    console.log(teams);
    for (team of teams)
        batch.set(db.collection("Events").doc(event).collection("Teams").doc(team), {
            teamNum: team,
            matches: {},
            averages: getEmptyMatchData().gamePlay
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
 */
app.post("/setEvent", (req, res) => {
    db.collection("MetaData").doc("CurrentEvent").set({ event: req.body.event })
    db.collection("Events").doc(req.body.event).set({ name: req.body.event  })
    res.send("All done");
})

/**
 * Returns all events in database
 */
app.get("/getAllEvents", async (req, res) => {
    
   db.collection("Events").listDocuments()
   .then(docs =>{
       var events = [];
       for(i in docs)
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
 */
app.get("/getDetailedMatches", async (req, res) => {
    var event = req.query.event;
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

/*************************** END OF ADMIN SETUP CODE  ****************************/


/**
 * Returns the name of the current event
 * @return the name of the current event
 */
app.get("/getCurrentEvent", (req, res) => {
    getCurrentEvent()
        .then((event) => {
            return event.get();
        })
        .then((snap) => {
            res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
            res.send(snap.data().name);
        })
        .catch((err) => {
            console.error(err);
        })
})

/**
 * Returns the event key (ID) of the current event
 * 
 * @return the event key (ID) of the current event
 */
app.get("/getCurrentEventID", (req, res) => {
    getCurrentEvent()
        .then(event => {
            res.send(event.id);
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        })
})

/**
 * Returns a list of each match number within the current event
 * 
 * @return a list of each match number within the current event
 */
app.get("/getMatches", (req, res) => {
    getCurrentEvent()
        .then((event) => {
            return event.collection("Matches").listDocuments()
        })
        .then(docs => {
            var matches = [];
            for (match of docs)
                matches.push(match.id);
            res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
            res.send(matches);
        })
        .catch(err => {
            console.error(err);
        })
})

/**
 * Returns a list of all teams within the current event
 * 
 * @return a list of all teams within the current event
 */
app.get("/getAllTeams", (req, res) => {
    getCurrentEvent()
        .then((event) => {
            return event.collection("Teams").listDocuments()
        })
        .then(docs => {
            var teams = [];
            for (team of docs)
                teams.push(team.id);
            res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
            res.send(teams);
        })
})

/**
 * Returns the teams within a given match 
 * 
 * @param match - inside the request sent, this must contain the desired match's number
 * @return the teams within a given match
 */
app.get("/getTeamsInMatch", (req, res) => {
    var match = req.query.match;
    getCurrentEvent()
        .then((event) => {
            return event.collection("Matches").doc(match).get()
        })
        .then((match) => {
            res.send(match.data());
        })
        .catch((err) => {
            console.error(err);
        })
})

/**
 * Returns all the data for a given team in the current event
 * 
 * @param team - inside the request sent, this must contain the desired team's number
 * @return all the data for a given team in the current event
 */
app.get("/getTeamData", (req, res) => {
    var team = req.query.team;
    getCurrentEvent()
        .then(event => {
            return event.collection("Teams").doc(team).get()
        })
        .then(teamDataSnap => {
            res.send(teamDataSnap.data())
        })
        .catch((err) => {
            console.error(err);
        })
})

/**
 * Returns a list of the data for each and every team within the current event
 * 
 * @return a list of the data for each and every team within the current event
 */
app.get("/getAllTeamData", (req, res) => {
    var order = 'desc';
    var path = "averages.totalScore"
    return getCurrentEvent()
        .then(event => {
            return event.collection("Teams").orderBy(path, order).get();
        })
        .then(snap => {
            var response = [];
            snap.forEach(doc => {
                response.push([doc.id, doc.data()["averages"]])
            })
            res.send(response);
        })
})

/**
 * Returns an empty version of the storage object used for scouting data collection
 * 
 * @return an empty version of the storage object used for scouting data collection
 */
app.get('/getEmptyData', (req, res) => {
    res.send(getEmptyMatchData());
})

/**
 * Returns an empty match data storage object
 * 
 * @return an empty match data storage object
 */
function getEmptyMatchData() {
    return {
        match: "",
        team: "",
        gamePlay: {
            auto: {
                "delivery_one_is_stone": 0,
                "delivery_one_is_skystone": 0,
                "delivery_two_is_stone": 0,
                "delivery_two_is_skystone": 0,
                "extra_delivers": 0,
                "stones_placed": 0,
                "started_in_loading": 0,
                "started_in_build": 0,
                "foundation_repositioned": 0,
                "parked": 0,
                "score": 0,
            },
            teleop: {
                "delivered": 0,
                "placed": 0,
                "score": 0,
            },
            end: {
                "capstone_placed": 0,
                "capstone_height": 0,
                "foundation_repositioned": 0,
                "parked": 0,
                "score": 0,
            },
            totalScore: 0
        }
    }

}

/**
 * Returns an object containing the point values for each task being scouted
 * 
 * @return an object containing the point values for each task being scouted
 */
function getDataPointValues() {

    return {
        auto: {
            "delivery_one_is_stone": 2,
            "delivery_one_is_skystone": 10,
            "delivery_two_is_stone": 2,
            "delivery_two_is_skystone": 10,
            "extra_delivers": 2,
            "stones_placed": 4,
            "started_in_loading": 0,
            "started_in_build": 0,
            "foundation_repositioned": 10,
            "parked": 5,
        },
        teleop: {
            "delivered": 1,
            "placed": 1,
        },
        end: {
            "capstone_placed": 5,
            "capstone_height": 1,
            "foundation_repositioned": 15,
            "parked": 5,
        },
    }
}

/**
 * Returns an object containing each task which only one team can accomplish per match
 * 
 * @return an object containing each task which only one team can accomplish per match
 */
function getDependentData() {

    return {
    }
}

/**
 * Saves the scoutted data and updates the firebase database
 * 
 * @param data - inside the request sent, this must be the match data storage objected filled with scouted data
 */
app.post("/saveData", (req, res) => {
    var data = req.body;
    getCurrentEvent()
        .then((event) => {
            let teamRef = event.collection("Teams").doc(data.team);
            db.runTransaction((transaction) => {
                return transaction.get(teamRef)
                    .then(teamDoc => {
                        var teamData = teamDoc.data();
                        if (teamData.matches.hasOwnProperty(data.match)) {
                            console.log("Match " + data.match + " for team " + data.team + " Already scouted")
                            return
                        }
                        var gamePlay = convertToProperData(data.gamePlay);
                        teamData.matches[data.match] = gamePlay;
                        var newAverages = updateAverages(teamData.averages, gamePlay, Object.keys(teamData.matches).length);
                        transaction.update(teamRef, { matches: teamData.matches, averages: newAverages });
                    })
            })
                .then((result) => {
                    res.send("done");
                })
                .catch((err) => {
                    console.error(err);
                })
        })
})


/**
 * Converts the given match data storage object filled with scoutted data from being filled 
 * with strings to being filled with the numeric values of those strings. 
 * 
 * @param {*} jsonData - a match data storage object filled with scoutted data 
 */
function convertToProperData(jsonData) {
    var pointValues = getDataPointValues();
    jsonData.totalScore = 0;
    for (gamePeriod in jsonData) {
        if (gamePeriod == "totalScore")
            continue;
        jsonData[gamePeriod].score = 0
        for (action in jsonData[gamePeriod]) {
            if (action == "score")
                continue;
            jsonData[gamePeriod][action] = Number(jsonData[gamePeriod][action]);
            jsonData[gamePeriod].score += jsonData[gamePeriod][action] * pointValues[gamePeriod][action];
        }
        jsonData.totalScore += jsonData[gamePeriod].score;
    }
    return jsonData;
}

/**
 * Update's a teams averages with the new scoutted data 
 * @param {*} averages - the current averages 
 * @param {*} newData - the new scoutted data
 * @param {*} num - the amount of matches now scoutted for the team 
 */
function updateAverages(averages, newData, num) {
    if (num == 1)
        return newData;

    for (gamePeriod in averages)
        for (score in averages[gamePeriod]) {
            var val = averages[gamePeriod][score] * (num - 1);
            val += Number(newData[gamePeriod][score]);
            averages[gamePeriod][score] = val / num;
        }
    var val = averages.totalScore * (num - 1) + Number(newData.totalScore);
    averages.totalScore = val / num;
    return averages;
}

/**
 * Returns a ranked list of teams and their average score for a given task
 * 
 * @param path - inside the request sent, this must be the path to where the task is stored
 * @param numTeams - inside the request sent, this must be how many teams in the ranked list are desired
 * @param isReversed - inside the request sent, this must be true for reversed, false otherwise
 * @return a ranked list of teams and their average score for a given task
 */
app.get("/getRanking", (req, res) => {
    var path = req.query.path;
    var numTeams = Number(req.query.numTeams);
    var order = req.query.isReversed == "true" ? 'asc' : "desc";
    getCurrentEvent()
        .then((event) => {
            if (numTeams <= 0)
                return event.collection("Teams").orderBy(path, order).get();
            else
                return event.collection("Teams").orderBy(path, order).limit(numTeams).get();
        })
        .then((snap) => {
            var data = [];
            path = path.split(".");
            snap.forEach(doc => {
                var value = doc.data();
                for (i = 0; i < path.length; i++)
                    value = value[path[i]];
                data.push([doc.id, value]);
            });
            res.send(data);
        })
})

/**
 * Calculates the predicted score for an alliance of teams if they played together
 * @param {*} allianceAverages - a list of the averages scores for each team in the alliance
 */
function calculateAllianceScore(allianceAverages) {
    var points = getDataPointValues(); // Also used for looping through
    var dependentData = getDependentData();
    var allianceScore = 0;
    for (gamePeriod in points)
        for (teamAverage of allianceAverages) {
            console.log(gamePeriod)
            //Adding average total score is unreliable because some tasks only require 1 out of 3 teams
            if (gamePeriod == "totalScore" || gamePeriod == "performance")
                continue;
            //If everything in this period is independent, just add the average score
            if (!(gamePeriod in dependentData)) {
                allianceScore += teamAverage[gamePeriod].score;
                continue;
            }

            for (action in teamAverage[gamePeriod]) {
                if (action == "score")
                    continue;

                //If this action is not a dependent action, then just add it to the score
                if (!(action in dependentData[gamePeriod]))
                    allianceScore += teamAverage[gamePeriod][action] * points[gamePeriod][action];
                else
                    if (dependentData[gamePeriod][action] <= teamAverage[gamePeriod][action])
                        dependentData[gamePeriod][action] = teamAverage[gamePeriod][action];
            }
        }

    for (gamePeriod in dependentData)
        for (action in dependentData[gamePeriod])
            allianceScore += dependentData[gamePeriod][action] * points[gamePeriod][action];

    return allianceScore

}

/**
 * Returns the predicted score for an alliance 
 * @param {FirebaseFirestore.QuerySnapshot} allianceSnap - the query snapshot containing 
 *                                          the data for the teams within the alliance
 * @return the predicted score for an alliance
 */
function getAllianceScore(allianceSnap) {
    var allianceAverages = []
    allianceSnap.forEach(team => {
        allianceAverages.push(team.data().averages);
    })
    return calculateAllianceScore(allianceAverages);
}

/**
 * Returns the predicted scores for a match 
 * @param blue - inside the request sent, this must be a list of teams in the blue alliance
 * @param red -  inside the request sent, this must be a list of teams in the red alliance
 */
app.get("/getWinner", (req, res) => {
    var blueAlliance = req.query.blue;
    var redAlliance = req.query.red;
    var blueScore = 0;
    var redScore = 0;
    var teamsRef;
    getCurrentEvent()
        .then((event) => {
            teamsRef = event.collection("Teams");
            return teamsRef.where('teamNum', 'in', blueAlliance).get();
        })
        .then((alliance) => {
            blueScore = getAllianceScore(alliance);
            return teamsRef.where('teamNum', 'in', redAlliance).get();
        })
        .then((alliance) => {
            redScore = getAllianceScore(alliance);
            res.send({ "blue": blueScore, "red": redScore });
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
})

async function getCurrentEvent() {
    return db.collection("MetaData").doc("CurrentEvent").get()
        .then(snap => {
            return db.collection("Events").doc(snap.data().event);
        })
}

exports.app = functions.https.onRequest(app);