const express = require("express");
const path = require("path");
const createError = require("http-errors");
const logger = require("morgan");

const db = require("./models/index").sequelize;
const routes = require("./routes/index");
const books = require("./routes/books");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/static", express.static(path.join(__dirname, "public")));

//Routes
app.use(routes);
app.use("/books", books);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, "We can't seem to find the page you're looking for."));
});

// global catch error
app.use((err, req, res, next) => {
  if (err.status === 404) {
    console.log(err.message);
    res.status(404).render("page-not-found", { err });
  } else {
    err.message =
      err.message ||
      "Take it easy, I don't think it's about you. Press the button on the bottom and enjoy";
    console.log(err.message);
    res.status(err.status || 500).render("error", { err });
  }
});

// Check database connection
db.authenticate()
  .then(() => console.log("Database connection has been established"))
  .catch((err) =>
    console.log("Database connection hasn't been established", err)
  );

db.sync().then(() => {
  app.listen(3000, () => {
    console.log("The application is running on localhost:3000!");
  });
});
