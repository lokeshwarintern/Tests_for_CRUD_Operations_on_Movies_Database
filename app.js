const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (error) {
    console.log(`DB error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
const convertDbToResponseObj = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};
const convertDirectorDbToResponseDb = (directorObj) => {
  return {
    directorId: directorObj.director_id,
    directorName: directorObj.director_name,
  };
};

//GET Movies
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie;
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});

//POST (create movies)
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const createMovieQuery = `
            INSERT INTO
                movie(director_id, movie_name, lead_actor)
            VALUES (
                ${directorId},
                '${movieName}',
                '${leadActor}'
            );
    `;
  try {
    const createQuery = await db.run(createMovieQuery);
    response.send("Movie Successfully Added");
  } catch (error) {
    console.log(`insert Error:${error.message}`);
  }
});

//GET (getting a movie based on movie id)
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT 
            *
        FROM
            movie
        WHERE
            movie_id = ${movieId};

    `;
  const movieObj = await db.get(getMovieQuery);
  response.send(convertDbToResponseObj(movieObj));
});

//PUT(Update movie details)
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateQuery = `
        UPDATE  
            movie
        SET
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE
            movie_id = ${movieId};
    `;
  const updateDbResponse = await db.run(updateQuery);
  response.send("Movie Details Updated");
});

//DELETE(Deletes a movie from the movie table based on the movie ID)
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
        DELETE FROM
        movie
        WHERE
            movie_id = ${movieId};

    `;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

//GET(get the details from director table)
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
            SELECT
                *
            FROM
                director;

    `;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachItem) => convertDirectorDbToResponseDb(eachItem))
  );
});

//GET(get a list of all movie names directed by a specific director)
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const specificDirectorQuery = `
                SELECT
                    movie_name
                FROM
                    movie
                WHERE
                    director_id = ${directorId};

        `;
  const getSpecificMovies = await db.all(specificDirectorQuery);
  response.send(
    getSpecificMovies.map((eachItem) =>
      convertDbObjectToResponseObject(eachItem)
    )
  );
});

module.exports = app;
