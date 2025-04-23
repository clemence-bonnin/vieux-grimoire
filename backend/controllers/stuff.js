const Book = require('../models/Book');
const fs = require('fs');
const sharp = require('sharp');

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

    const hasRatings = Array.isArray(bookObject.ratings) && bookObject.ratings.length > 0;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl,
      ratings: hasRatings ? bookObject.ratings : [],
      averageRating: hasRatings
        ? Math.round(
            bookObject.ratings.reduce((acc, r) => acc + r.grade, 0) / bookObject.ratings.length
          )
        : 0
    });

    book.save()
      .then(() => res.status(201).json({ message: 'Livre ajouté !' }))
      .catch(error => {
        fs.unlink(`images/${req.file.filename}`, () => {
          console.error("Erreur lors de l'enregistrement du livre :", error);
          res.status(400).json({ error });
        });
      });

  } catch (error) {
    if (req.file) {
      fs.unlink(`images/${req.file.filename}`, () => {
        res.status(400).json({ error });
      });
    } else {
      res.status(400).json({ error });
    }
  }
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
} : { ...req.body };

    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
    .then((book) => {
        if (book.userId != req.auth.userId) {
          return res.status(401).json({ message : 'Accès non autorisé'});
        } 
        if (req.file && book.imageUrl) {
          const oldFilename = book.imageUrl.split('/images/')[1];
          fs.unlink(`images/${oldFilename}`, (err) => {
          });
        }
            Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
            .then(() => res.status(200).json({message : 'Livre modifié!'}))
            .catch(error => res.status(401).json({ error }));
    })
    .catch((error) => {
        res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  const bookId = req.params.id;

  Book.findOne({ _id: bookId })
    .then(book => {
      if (!book) return res.status(404).json({ message: "Livre non trouvé" });

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      const filename = book.imageUrl.split('/images/')[1];

      fs.unlink(`images/${filename}`, (err) => {
        if (err) console.error("Erreur lors de la suppression de l'image :", err);

        Book.deleteOne({ _id: bookId })
          .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
      .sort({ averageRating: -1 })
      .limit(3)
          .then((books) => res.status(200).json(books))
          .catch(error => res.status(500).json({ error }))
};

exports.createRating = (req, res, next) => {
  const addRating = {
      userId: req.auth.userId,
      grade: req.body.rating
  };
  
  if (addRating.grade < 0 || addRating.grade > 5) {
      return res.status(400).json({ message: 'La note doit se trouver entre 0 et 5' });
  }
  Book.findOne({ _id: req.params.id }) 
      .then((book) => {
          if (book.ratings.find(r => r.userId === req.auth.userId)) { 
              return res.status(400).json({ message: 'Ce livre a déjà été noté' });
          } else {
              book.ratings.push(addRating); 
              book.averageRating = (book.averageRating * (book.ratings.length - 1) + addRating.grade) / book.ratings.length; 
              return book.save(); 
          }
      })
      .then((savedBook) => res.status(201).json(savedBook))
      .catch(error => res.status(400).json({ error }));
};

