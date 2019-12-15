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
const CONFIG_SHEET_ID = functions.config().spread_sheet.id;

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://us-central1-ftcscouting-63cc8.cloudfunctions.net/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const functionsOauthClient = new OAuth2Client(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
    FUNCTIONS_REDIRECT);

// OAuth token cached locally.
let oauthTokens = null;

var currentEvent = null;

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
        var id = parseInt(data.matchId) + 2; //because in the sheet the first two columns are info
        var col = "";
        if (parseInt(id / 26) > 0)
            col += String.fromCharCode(parseInt(id / 26) - 1 + 65);
        col += String.fromCharCode(id % 26 + 65);
        var sheetValues = [data.team, data.match.substring(5).trim(), "", data.auto.position, ""];
        sheetValues = sheetValues.concat(data.auto.delivery);
        sheetValues.push("");
        sheetValues = sheetValues.concat(data.auto.placement);
        sheetValues.push(data.auto.foundation, data.auto.parked, "", data.teleop.delivery, data.teleop.placed, 
        data.teleop.capstone.placed, data.teleop.capstone.height, data.teleop.foundation, data.teleop.parked);
        return appendPromise({
            spreadsheetId: CONFIG_SHEET_ID,
            range: context.params.event  + "!" + col + '1:'+col,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'OVERWRITE',
            resource: {
                values: [sheetValues],
                "majorDimension": "COLUMNS"
            },
        });
    });

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

/**
 * Saves the data for a played match by a team
 */
app.post('/saveData',(req, res) =>{
    var data = req.body.data;
    var update = { };
    update[data.match] = data;
    db.collection("Events").doc(currentEvent).collection("Teams").doc(data.team).update(update)
    .catch(err =>{
        console.error(err);
    })
    res.send("Save Done")
})

/**
 * Saves the inputted teams for the inputted event
 */
app.post('/saveTeams',(req, res) => {
    var event = req.body.event;
    db.collection("Events").doc(event).set({})
    .then(snap =>{
    })
    .catch(err =>{
        console.error(err);
    })
    for(i in req.body.teams)
        db.collection("Events").doc(event).collection("Teams").doc(req.body.teams[i]).set({})
        .catch(err =>{
            console.error(err);
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
    currentEvent = req.body.event;
    res.send("All done");
})

/**
 * Returns all events in database
 */
app.get("/getAllEvents", async (req, res) => {
    var events = [];
  await db.collection("Events").listDocuments()
   .then(docs =>{
       for(i in docs)
        events.push(docs[i].id);
   })
   .catch(err => {
       console.error(err);
   })
   res.send(events);
})

/**
 * Returns the current event
 */
app.get("/getCurrentEvent", (req, res) => {
    res.send(currentEvent);
})

/**
 * Returns the matches in the current event
 */
app.get("/getMatches", async (req, res) =>{
    var matches = [];
   await db.collection("Events").doc(currentEvent).collection("Matches").listDocuments()
    .then(docs => {
        for(i in docs)
            matches.push(docs[i].id);
    })
    .catch(err => {
        console.error(err);
    })
    res.send(matches);
})

/**
 * Returns the teams in a given match
 */
app.get("/getTeamsInMatch", (req, res) =>{
    var match = req.query.match;
    db.collection("Events").doc(currentEvent).collection("Matches").doc(match).get()
    .then(snap =>{
        res.send(snap.data());
    })
    .catch(err =>{
        console.error(err);
    })
})

/**
 * Returns all the teams in the current event
 */
app.get("/getTeamsInEvent", async (req, res) => {
    var event = req.query.event;
    var teams = [];
    await db.collection("Events").doc(event).collection("Teams").listDocuments()
    .then(docs => {
        for(i in docs)
            teams.push(docs[i].id);
    })
    .catch(err => {
        console.error(err);
    })
    res.send(teams);
})

/**
 * Returns all the matches, along with the teams in each match, for a given event
 */
app.get("/getMatchesInEvent", async (req, res) =>{
    var event = req.query.event;
    var matches = [];
    await db.collection("Events").doc(event).collection("Matches").listDocuments()
    .then(docs =>{
        return db.getAll(...docs)
    })
    .then(async docSnaps => {
        var match = [];
        for (let docSnap of docSnaps) 
            match.push(await docSnap.get("teams"))
        console.log(match);
        matches.push(match)
    })
    .catch(err => {
        console.error(err)
    })
    res.send(matches);
})

exports.app = functions.https.onRequest(app);