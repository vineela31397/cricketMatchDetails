const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};
initializeDBAndServer();
const convertDBPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertDBMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertDBPlayerMatchScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
  SELECT *
  FROM player_details;`;
  const statesArray = await db.all(getPlayersQuery);
  response.send(
    statesArray.map((eachPlayer) =>
      convertDBPlayerObjectToResponseObject(eachPlayer)
    )
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT *
  FROM player_details
  WHERE player_id=${playerId};`;
  const playerArray = await db.get(getPlayerQuery);
  response.send(convertDBPlayerObjectToResponseObject(playerArray));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE player_details
  SET player_name="${playerName}"
  WHERE player_id=${playerId};`;
  const updatePlayerArray = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT *
  FROM match_details
  WHERE match_id=${matchId};`;
  const matchArray = await db.get(getMatchQuery);
  response.send(convertDBMatchObjectToResponseObject(matchArray));
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `
  SELECT match_id AS matchId,match AS match,year AS year
  FROM match_details NATURAL JOIN player_match_score
  WHERE player_id=${playerId};`;
  const matches = await db.all(getMatchesOfPlayerQuery);
  response.send(matches);
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
  SELECT player_id AS playerId,player_name AS playerName
  FROM  player_match_score NATURAL JOIN player_details
  WHERE match_id=${matchId};`;
  const players = await db.all(getPlayerQuery);
  response.send(players);
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT player_id,player_name,SUM(score),SUM(fours),SUM(sixes)
  FROM  player_match_score NATURAL JOIN player_details
  WHERE player_id=${playerId};`;
  const playerScores = await db.get(getPlayerQuery);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["player_name"],
    totalScore: playerScores["SUM(score)"],
    totalFours: playerScores["SUM(fours)"],
    totalSixes: playerScores["SUM(sixes)"],
  });
});
module.exports = app;
