// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express')
const app = express()

//Firebase realtime database
const db = admin.firestore();

const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');

const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const SHEET_ID = functions.config().spread_sheet.id;

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://us-central1-ftcscouting-63cc8.cloudfunctions.net/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const functionsOauthClient = new OAuth2Client(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
    FUNCTIONS_REDIRECT);

// OAuth token cached locally.
let oauthTokens = null;

// visit the URL for this Function to request tokens
exports.authgoogleapi = functions.https.onRequest((req, res) => {
    res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    res.redirect(functionsOauthClient.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    }));
});
// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';

// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    const code = req.query.code;
    try {
        console.log("Trying code oauth code");
        const { tokens } = await functionsOauthClient.getToken(code);
        console.log("got tokens: " + tokens);
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        await admin.database().ref(DB_TOKEN_PATH).set(tokens);
        return res.status(200).send('App successfully configured with new Credentials. '
            + 'You can now close this page.');
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
});

/**
 * Whenever new match data for a team is added to the database, this will fire and update the storage spreadsheet
 */
exports.appendrecordtospreadsheet = functions.firestore.document(`Events/{event}/Teams/{teams}`).onUpdate(
    (change, context) => {
        console.log("On create called");
        var current = change.after.data();
        var change = Object.keys(current).filter(val => !Object.keys(change.before.data()).includes(val));
        var data = current[change[0]];
        console.log(data);
        var id = parseInt(data.matchId) + 3; //because in the sheet the first two columns are info
        var col = "";
        if (parseInt(id / 26) > 0)
            col += String.fromCharCode(parseInt(id / 26) - 1 + 65);
        col += String.fromCharCode(id % 26 + 65);
        console.log("column: " + col);
        //This is here because Marcus's spreadsheet requries that a robot be marked "functional"
        // before it performs calculations on the data
        var functionalSpot = getSpreadsheetScoutInput(col + "9");
        functionalSpot.values.push(["1"]);

        var auto = getSpreadsheetScoutInput(col + "16");
        var teleop = getSpreadsheetScoutInput(col + "66");
        var endBooleans = getSpreadsheetScoutInput(col + "116");
        var end = getSpreadsheetScoutInput(col + "125");

        auto.values.push([data.auto.oneDeliverStone, data.auto.oneDeliverSkystone, 
                    data.auto.twoDeliverStone, data.auto.twoDeliverSkystone,
                    data.auto.extraDelivers, data.auto.placed, data.auto.foundation,
                    data.auto.parked]);
        teleop.values.push( [data.teleop.delivery, data.teleop.placed] );
        endBooleans.values.push([data.teleop.capstone.placed, data.teleop.foundation, data.teleop.parked]);
        end.values.push([data.auto.position, data.teleop.capstone.height]);

        var sendData = [functionalSpot, auto, teleop, endBooleans, end]
        console.log("Send Data");
        console.log(sendData);

        return batchUpdatePromise({
            spreadsheetId: SHEET_ID,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: sendData
            }
        })
    });

function getSpreadsheetScoutInput(startIndex)
{
    return {
        majorDimension: "COLUMNS",
        range: "Match Scouting!" + startIndex,
        values: []
    }
}

// accepts an append request, returns a Promise to append it, enriching it with auth
function appendPromise(requestWithoutAuth) {
    return new Promise((resolve, reject) => {
        return getAuthorizedClient().then((client) => {
            console.log("Sheets append promise called");
            const sheets = google.sheets('v4');
            const request = requestWithoutAuth;
            request.auth = client;
            return sheets.spreadsheets.values.append(request, (err, response) => {
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    return reject(err);
                }
                return resolve(response.data);
            });
        });
    });
}

function batchUpdatePromise(requestWithoutAuth) {
    return new Promise((resolve, reject) => {
        return getAuthorizedClient().then((client) => {
            console.log("Sheets batch update promise called");
            const sheets = google.sheets('v4');
            const request = requestWithoutAuth;
            request.auth = client;
            return sheets.spreadsheets.values.batchUpdate(request, (err, response) => {
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    return reject(err);
                }
                return resolve(response.data);
            });
        });
    });
}

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
async function getAuthorizedClient() {
    console.log("Get authorized client called");
    if (oauthTokens) {
        return functionsOauthClient;
    }
    const snapshot = await admin.database().ref(DB_TOKEN_PATH).once('value');
    oauthTokens = snapshot.val();
    functionsOauthClient.setCredentials(oauthTokens);
    return functionsOauthClient;
}

app.post('/saveTeamsToSpreadsheet', (req, res) => {
    getCurrentEvent()
    .then(event => {
        return db.collection("Events").doc(event).collection("Teams").listDocuments();
    })
    .then(docs => {
        var teams = [];
        for (i in docs)
            teams.push(docs[i].id);
        return appendPromise({
            spreadsheetId: SHEET_ID,
            range:   "Schedule!M6",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'OVERWRITE',
            resource: {
                values: [teams],
                "majorDimension": "COLUMNS"
            },
        });
    })
    .then((val) => {
        res.send("All Done");
    })
    .catch(err => {
        console.error(err);
        res.send(err);
    })
})

app.post('/saveMatchesToSpreadsheet', (req, res) => {
    getCurrentEvent()
    .then(event => {
        return db.collection("Events").doc(event).collection("Matches").listDocuments()
    })
    .then(docs => {
        return db.getAll(...docs)
    })
    .then(async docSnaps => {
        var matches = [];
        for (let docSnap of docSnaps)
            matches.push(await docSnap.get("teams"))
        return appendPromise({
            spreadsheetId: SHEET_ID,
            range: "Schedule!B7",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'OVERWRITE',
            resource: {
                values: matches,
                "majorDimension": "ROWS"
            },
        });
    })
    .then(val => {
        res.send("All Done");
    })
    .catch(err => {
        console.error(err)
        res.send(err);
    })
})

/**
 * Saves the data for a played match by a team
 */
app.post('/saveData',(req, res) =>{
    var data = req.body.data;
    var update = { };
    update[data.match] = data;
    getCurrentEvent()
    .then(event => {
        db.collection("Events").doc(event).collection("Teams").doc(data.team).update(update)
        res.send("Save Done")
    })
    .catch(err =>{
        console.error(err);
    })
   
})

/**
 * Saves the inputted teams for the inputted event
 */
app.post('/saveTeams',(req, res) => {
    var event = req.body.event;
    for (team of req.body.teams)
        db.collection("Events").doc(event).collection("Teams").doc(team).create({})
        .catch(err => {
            console.log(err);
        })
    res.send("Teams done");
})

/**
 * Saves the inputted matches for the inputted event
 */
app.post("/saveMatches", (req, res) => {
    var event = req.body.event;
    for(match in req.body.matches)
    {
        var matchNum = "" + ((parseInt(match) + 1));
        if(matchNum.length == 1)
            matchNum = "0" + matchNum;
        db.collection("Events").doc(event).collection("Matches").doc("Match " + matchNum)
        .set({ "id":(parseInt(match) + 1),"teams": req.body.matches[match]})
        .catch(err => {
            console.error(err)
        })
    }
    res.send("Matches done");
})

/**
 * Sets the inputted event as the current event
 */
app.post("/setEvent", (req, res) => {
    db.collection("MetaData").doc("CurrentEvent").set({ event: req.body.event })
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
 * Returns the current event
 */
app.get("/getCurrentEvent", async (req, res) => {
    getCurrentEvent()
    .then(event => {
        res.send(event);
    })
})

function getCurrentEvent()
{
    return db.collection("MetaData").doc("CurrentEvent").get()
        .then(snap => {
           return snap.data().event;
        })
}

/**
 * Returns the matches in the current event
 */
app.get("/getMatches", async (req, res) =>{
    getCurrentEvent()
    .then(event => {
       return db.collection("Events").doc(event).collection("Matches").listDocuments()
    }) 
    .then(docs => {
        var matches = [];
        for(i in docs)
            matches.push(docs[i].id);
        res.send(matches);
    })
    .catch(err => {
        console.error(err);
        res.send(err);
    })
   
})

/**
 * Returns the teams in a given match
 */
app.get("/getTeamsInMatch", (req, res) =>{
    var match = req.query.match;
    getCurrentEvent()
    .then(event => {
        return db.collection("Events").doc(event).collection("Matches").doc(match).get()
    })
    .then(snap =>{
        res.send(snap.data());
    })
    .catch(err =>{
        console.error(err);
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
        for(i in docs)
            teams.push(docs[i].id);
        res.send(teams);
    })
    .catch(err => {
        console.error(err);
        res.send(err);
    })
  
})

/**
 * Returns all the matches, along with the teams in each match, for a given event
 */
app.get("/getMatchesInEvent", async (req, res) =>{
    var event = req.query.event;
    db.collection("Events").doc(event).collection("Matches").listDocuments()
    .then(docs =>{
        return db.getAll(...docs)
    })
    .then(async docSnaps => {
        var matches = [];
        for (let docSnap of docSnaps) 
            matches.push(await docSnap.get("teams"))
        res.send(matches);
    })
    .catch(err => {
        console.error(err)
        res.send(err);
    })
})

exports.app = functions.https.onRequest(app);