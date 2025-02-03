// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer konfiguráció: fájlok a "public/uploads" mappába
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Példaképp adatok tárolása
let newsItems = [
  { id: 1, title: "Új esemény bejelentése", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", media: "" },
  { id: 2, title: "Legfrissebb hírek", content: "Quisque commodo magna ac mauris congue, vel tempus eros laoreet.", media: "" }
];

let products = [
  { id: 1, name: "Termék 1", description: "Rövid leírás a termékről", price: 1000 },
  { id: 2, name: "Termék 2", description: "Rövid leírás a termékről", price: 2000 }
];

// API végpontok

app.get('/', (req, res) => {
  res.send("Backend sablon - Amicale Légion Étrangère Magyar Közösség");
});

// Hírek API
app.get('/api/news', (req, res) => {
  res.json(newsItems);
});
app.post('/api/news', (req, res) => {
  const newItem = {
    id: newsItems.length + 1,
    title: req.body.title,
    content: req.body.content,
    media: req.body.media || ""
  };
  newsItems.push(newItem);
  res.json(newItem);
});
app.put('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const newsItem = newsItems.find(n => n.id === id);
  if (newsItem) {
    newsItem.title = req.body.title || newsItem.title;
    newsItem.content = req.body.content || newsItem.content;
    newsItem.media = req.body.media || newsItem.media;
    res.json(newsItem);
  } else {
    res.status(404).json({ error: "Hír nem található" });
  }
});
app.delete('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = newsItems.findIndex(n => n.id === id);
  if (index !== -1) {
    const removed = newsItems.splice(index, 1);
    res.json(removed);
  } else {
    res.status(404).json({ error: "Hír nem található" });
  }
});

// Termékek API
app.get('/api/products', (req, res) => {
  res.json(products);
});
app.post('/api/products', (req, res) => {
  const newProduct = {
    id: products.length + 1,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price
  };
  products.push(newProduct);
  res.json(newProduct);
});
app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (product) {
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    res.json(product);
  } else {
    res.status(404).json({ error: "Termék nem található" });
  }
});
app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    const removed = products.splice(index, 1);
    res.json(removed);
  } else {
    res.status(404).json({ error: "Termék nem található" });
  }
});

// Adományozás API
app.post('/api/donate', (req, res) => {
  const donation = {
    name: req.body.name,
    email: req.body.email,
    amount: req.body.amount
  };
  console.log("Adomány érkezett:", donation);
  res.json({ message: "Köszönjük az adományát!", donation });
});

// Admin bejelentkezés API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "password") {
    res.json({ message: "Sikeres bejelentkezés" });
  } else {
    res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });
  }
});

// Fájl feltöltés API (Multer)
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nincs fájl feltöltve" });
  }
  const fileUrl = '/uploads/' + req.file.filename;
  res.json({ url: fileUrl });
});

// Szerver indítása
app.listen(PORT, () => {
  console.log(`Szerver fut a ${PORT} porton`);
});
