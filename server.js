// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Győződjünk meg róla, hogy a "data" mappa létezik
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
const NEWS_FILE = path.join(dataDir, 'news.json');

// Segédfüggvények a hírek fájlba mentéséhez
function readNews() {
  if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([]));
  }
  const content = fs.readFileSync(NEWS_FILE, 'utf8');
  try {
    return JSON.parse(content);
  } catch (err) {
    return [];
  }
}

function writeNews(news) {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
}

// Multer konfiguráció: fájlok a "public/uploads" mappába kerülnek
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

// Példaképp termékadatok
let products = [
  { id: 1, name: "Termék 1", description: "Rövid leírás a termékről", price: 1000 },
  { id: 2, name: "Termék 2", description: "Rövid leírás a termékről", price: 2000 }
];

// Root endpoint
app.get('/', (req, res) => {
  res.send("Backend sablon - Amicale Légion Étrangère Magyar Közösség");
});

// Hírek API (perzisztens tárolás JSON fájlban)
app.get('/api/news', (req, res) => {
  const newsItems = readNews();
  res.json(newsItems);
});

app.post('/api/news', (req, res) => {
  let newsItems = readNews();
  const newItem = {
    id: newsItems.length ? newsItems[newsItems.length - 1].id + 1 : 1,
    title: req.body.title,
    content: req.body.content,
    media: req.body.media || "",
    timestamp: new Date().toISOString()  // Elmentjük a posztolás időpontját
  };
  newsItems.push(newItem);
  writeNews(newsItems);
  res.json(newItem);
});

app.put('/api/news/:id', (req, res) => {
  let newsItems = readNews();
  const id = parseInt(req.params.id);
  const newsItem = newsItems.find(n => n.id === id);
  if (newsItem) {
    newsItem.title = req.body.title || newsItem.title;
    newsItem.content = req.body.content || newsItem.content;
    newsItem.media = req.body.media || newsItem.media;
    // Az eredeti posztolási időpontot nem változtatjuk meg
    writeNews(newsItems);
    res.json(newsItem);
  } else {
    res.status(404).json({ error: "Hír nem található" });
  }
});

app.delete('/api/news/:id', (req, res) => {
  let newsItems = readNews();
  const id = parseInt(req.params.id);
  const index = newsItems.findIndex(n => n.id === id);
  if (index !== -1) {
    const removed = newsItems.splice(index, 1);
    writeNews(newsItems);
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

// Új API végpont: a szerveren feltöltött médiafájlok listázása
app.get('/api/media', (req, res) => {
  const type = req.query.type; // várható érték: "image", "media" vagy "file"
  const directory = path.join(__dirname, 'public/uploads');
  fs.readdir(directory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Hiba a fájlok olvasása közben." });
    }
    let fileList = files.map(filename => {
      return {
        name: filename,
        url: '/uploads/' + filename
      };
    });
    // Típus szerinti szűrés
    if (type === 'image') {
      fileList = fileList.filter(file => file.name.match(/\.(jpg|jpeg|png|gif)$/i));
    } else if (type === 'media') {
      fileList = fileList.filter(file => file.name.match(/\.(mp4|webm)$/i));
    }
    res.json(fileList);
  });
});

// Szerver indítása
app.listen(PORT, () => {
  console.log(`Szerver fut a ${PORT} porton`);
});
