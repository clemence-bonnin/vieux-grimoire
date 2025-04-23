const sharp = require("sharp"); 
const fs = require("fs"); 
const path = require("path");

module.exports = (req, res, next) => {

  if (!req.file) return next();

  const originalName = req.file.originalname.split('.')[0].replace(/ /g, "_");
  const timestamp = Date.now();
  const fileName = `${timestamp}-${originalName}.webp`;
  const folder = "images";
  const filePath = path.join(folder, fileName);  

  sharp(req.file.buffer) 
    .resize(206, 260, {
      fit: 'cover',
      withoutEnlargement: false 
    })
    .webp({ quality: 60 }) 
    .toFile(filePath) 


    .then(() => {
      req.file.filename = fileName;
      req.file.path = filePath;
      next();
    })

    .catch((error) => {
      console.error('Erreur lors de la compression de l’image :', error.message);
      res.status(500).json({ error: 'Erreur lors du traitement de l’image' });
    });
};
