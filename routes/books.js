const express = require("express");
const createError = require("http-errors");
const router = express.Router();
const { Op } = require("sequelize");

const Book = require("../models").Book;

//number of books to show on the page
const PAGE_LIMIT = 4;
// current page number
const PAGE_NUMBER = 1;

/* Handler function to wrap each route. */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  };
}

// List all books
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // search query
    const { query } = req.query;
    // take url for pagination
    let url = `${req.baseUrl}?`;
    let searchCondition = null;
    if (query) {
      url = `${req.baseUrl}?query=${query}&`;
      searchCondition = {
        [Op.or]: [
          {
            title: {
              [Op.like]: "%" + query + "%",
            },
          },
          {
            author: {
              [Op.like]: "%" + query + "%",
            },
          },
          {
            genre: {
              [Op.like]: "%" + query + "%",
            },
          },
          {
            year: {
              [Op.like]: "%" + query + "%",
            },
          },
        ],
      };
    }

    // pagination
    const page = parseInt(req.query.page) || PAGE_NUMBER;
    const offset = (page - 1) * PAGE_LIMIT;
    // order by last added
    const order = [["id", "DESC"]];

    // get books according to conditions
    const books = await Book.findAll({
      where: searchCondition,
      limit: PAGE_LIMIT,
      offset,
      order,
    });
    // get book count
    const numberOfTotalBooks = await Book.count({ where: searchCondition });
    // get page count for paging
    const pageCount = Math.ceil(numberOfTotalBooks / PAGE_LIMIT);

    res.render("index", {
      books,
      pageCount,
      page,
      query,
      url,
      title: "Books",
    });
  })
);

// Shows the create new book form
router.get("/new", (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
});

// Posts a new book to the database
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect(`/books/${book.id}`);
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        // checking the error
        book = await Book.build(req.body);
        res.render("books/new-book", {
          book,
          errors: error.errors,
          title: "New Book",
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

// Shows book detail form
router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("books/update-book", {
        book,
        title: `Edit Book: ${book.title}`,
      });
    } else {
      next(
        createError(404, "We can't seem to find the book you're looking for.")
      );
    }
  })
);

// Updates book info in the database
router.post(
  "/:id",
  asyncHandler(async (req, res, next) => {
    let book;
    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect(`/books/${book.id}`);
      } else {
        next(
          createError(404, "We can't seem to find the book you're looking for.")
        );
      }
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/update-book", {
          book,
          errors: error.errors,
          title: `Edit Book: ${book.title}`,
        });
      } else {
        throw error;
      }
    }
  })
);

// Delete a book
router.post(
  "/:id/delete",
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      await book.destroy();
      res.redirect("/books");
    } else {
      next(
        createError(404, "We can't seem to find the book you're looking for.")
      );
    }
  })
);

module.exports = router;
