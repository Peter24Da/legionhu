document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin.js betöltődött");
  
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginSection = document.getElementById('login-section');
  const logoutBtn = document.getElementById('logout-btn');
  const newsTab = document.getElementById('news-tab');
  const productsTab = document.getElementById('products-tab');
  const tabButtons = document.querySelectorAll('.admin-tabs button');

  // Jelszó megjelenítés kapcsoló
  const togglePassword = document.getElementById('toggle-password');
  const passwordField = document.getElementById('password');
  if (togglePassword && passwordField) {
    togglePassword.addEventListener('change', function() {
      passwordField.type = togglePassword.checked ? 'text' : 'password';
      console.log("TogglePassword: " + passwordField.type);
    });
  }

  // Aktív tab beállítása
  function setActiveTab(tab) {
    if (tab === 'news') {
      newsTab.style.display = 'block';
      productsTab.style.display = 'none';
    } else if (tab === 'products') {
      newsTab.style.display = 'none';
      productsTab.style.display = 'block';
    }
  }
  
  setActiveTab('news');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = btn.getAttribute('data-tab');
      console.log("Tab váltás: " + tab);
      setActiveTab(tab);
    });
  });

  // Bejelentkezési űrlap kezelése
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = passwordField.value;
    console.log("Bejelentkezési adatok:", username, password);
    
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      console.log("Bejelentkezési fetch válasz státusza:", res.status);
      if (res.ok) return res.json();
      else throw new Error('Hibás felhasználónév vagy jelszó');
    })
    .then(data => {
      console.log("Sikeres bejelentkezés:", data);
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      loadNews();  // Hírek betöltése keresés nélkül
      loadProducts();
    })
    .catch(err => {
      loginError.textContent = err.message;
      console.error("Bejelentkezési hiba:", err);
    });
  });
  
  // Kijelentkezés
  logoutBtn.addEventListener('click', function() {
    dashboardSection.style.display = 'none';
    loginSection.style.display = 'block';
  });
  
  // Hírek betöltése az admin felületre, opcionálisan keresési lekérdezéssel
  function loadNews(query = "") {
    console.log("Hírek betöltése az admin felületen, keresési lekérdezéssel:", query);
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        const newsList = document.getElementById('news-list');
        newsList.innerHTML = '';
        // Szűrés: csak azok a hírek jelennek meg, amelyek címében vagy tartalmában szerepel a keresett kifejezés
        const filteredData = data.filter(item => {
          return item.title.toLowerCase().includes(query.toLowerCase()) ||
                 item.content.toLowerCase().includes(query.toLowerCase());
        });
        filteredData.forEach(item => {
          // Időpont formázása: YYYY-MM-DD HH:MM
          let timestamp = "";
          if (item.timestamp) {
            const date = new Date(item.timestamp);
            timestamp = date.getFullYear() + '-' +
                        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + date.getDate()).slice(-2) + ' ' +
                        ('0' + date.getHours()).slice(-2) + ':' +
                        ('0' + date.getMinutes()).slice(-2);
          }
          let mediaHtml = '';
          if (item.media) {
            if(item.media.match(/\.(jpg|jpeg|png|gif)$/i)) {
              mediaHtml = `<img src="${item.media}" alt="Media" style="max-width:100px;">`;
            } else if(item.media.match(/youtube\.com|youtu\.be/)) {
              const embedUrl = getYouTubeEmbedUrl(item.media);
              mediaHtml = embedUrl ? 
                `<div class="responsive-iframe">
                   <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                 </div>` 
                : `<a href="${item.media}" target="_blank">${item.media}</a>`;
            }
            else if(item.media.match(/\.(mp4|webm)$/i)) {
              // Megjelenítjük a videó vezérlőit (controls), így a videónak lesz hangja
              mediaHtml = `<video src="${item.media}" width="100" controls style="cursor:pointer;"></video>`;
            } else {
              mediaHtml = `<a href="${item.media}" target="_blank">${item.media}</a>`;
            }
          }
          const div = document.createElement('div');
          div.classList.add('news-item');
          div.innerHTML = `<strong>${item.title} (${timestamp})</strong><br>${item.content}<br>${mediaHtml}<br>`;
          
          // Edit gomb
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Szerkesztés';
          editBtn.addEventListener('click', function() {
            populateNewsFormForEdit(item);
            // Automatikus görgetés a TinyMCE szerkesztő konténeréhez
            tinymce.get('news-content').getContainer().scrollIntoView({ behavior: 'smooth' });
          });
          
          // Törlés gomb
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Törlés';
          deleteBtn.addEventListener('click', function() {
            if(confirm("Biztosan törölni szeretnéd ezt a hírt?")) {
              deleteNews(item.id);
            }
          });
          
          div.appendChild(editBtn);
          div.appendChild(deleteBtn);
          newsList.appendChild(div);
        });
      })
      .catch(err => console.error("Hiba a hírek betöltésekor:", err));
  }
  
  // Segédfüggvény a YouTube embed URL kialakításához
  function getYouTubeEmbedUrl(url) {
    var regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[1].length === 11) {
      return 'https://www.youtube.com/embed/' + match[1] + '?rel=0&autoplay=1&mute=1';
    } else {
      return null;
    }
  }
  
  // Hír szerkesztési űrlap feltöltése
  function populateNewsFormForEdit(item) {
    document.getElementById('news-id').value = item.id;
    document.getElementById('news-title').value = item.title;
    tinymce.get('news-content').setContent(item.content);
    document.getElementById('news-media').value = item.media || "";
    document.getElementById('news-submit-btn').textContent = 'Frissítés';
    document.getElementById('news-cancel-btn').style.display = 'block';
  }
  
  // Szerkesztés megszakítása
  const newsCancelBtn = document.getElementById('news-cancel-btn');
  newsCancelBtn.addEventListener('click', function() {
    clearNewsForm();
  });
  
  // Hír űrlap resetelése
  function clearNewsForm() {
    document.getElementById('news-id').value = '';
    document.getElementById('news-title').value = '';
    tinymce.get('news-content').setContent('');
    document.getElementById('news-media').value = '';
    document.getElementById('news-submit-btn').textContent = 'Hír hozzáadása';
    newsCancelBtn.style.display = 'none';
  }
  
  // Hír űrlap beküldése
  const newsForm = document.getElementById('news-form');
  newsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title').value;
    const content = tinymce.get('news-content').getContent();
    const media = document.getElementById('news-media').value;
    
    if (id) {
      console.log("Frissítés: hír id " + id);
      fetch('/api/news/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, media })
      })
      .then(res => res.json())
      .then(() => {
        clearNewsForm();
        loadNews(document.getElementById('news-search').value);
      })
      .catch(err => console.error("Frissítési hiba:", err));
    } else {
      console.log("Új hír hozzáadása");
      fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, media })
      })
      .then(res => res.json())
      .then(() => {
        newsForm.reset();
        tinymce.get('news-content').setContent('');
        loadNews(document.getElementById('news-search').value);
      })
      .catch(err => console.error("Hír hozzáadási hiba:", err));
    }
  });
  
  // Hír törlése
  function deleteNews(id) {
    fetch('/api/news/' + id, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(() => {
      loadNews(document.getElementById('news-search').value);
    })
    .catch(err => console.error("Hír törlési hiba:", err));
  }
  
  // Fájl feltöltés kezelése (ha van ilyen rész a formban)
  const uploadBtn = document.getElementById('upload-btn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', function() {
      console.log("Feltöltés gomb kattintva");
      const fileInput = document.getElementById('media-upload');
      if (fileInput.files.length === 0) {
        alert("Kérlek válassz egy fájlt!");
        return;
      }
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('media', file);
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        console.log("Feltöltési fetch válasz:", response);
        return response.json();
      })
      .then(data => {
        console.log("Feltöltési fetch adat:", data);
        if (data.url) {
          document.getElementById('news-media').value = data.url;
          alert("Feltöltés sikeres!");
        } else {
          alert("Feltöltési hiba!");
        }
      })
      .catch(err => {
        console.error("Feltöltési hiba:", err);
        alert("Hiba történt a feltöltés során!");
      });
    });
  }
  
  // Termékek betöltése
  function loadProducts() {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        data.forEach(item => {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${item.name}</strong> - ${item.description} - ${item.price} Ft`;
          productsList.appendChild(div);
        });
      })
      .catch(err => console.error("Termék betöltési hiba:", err));
  }
  
  // Termék űrlap beküldése
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('product-name').value;
      const description = document.getElementById('product-description').value;
      const price = parseFloat(document.getElementById('product-price').value);
      
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price })
      })
      .then(res => res.json())
      .then(() => {
        productForm.reset();
        loadProducts();
      })
      .catch(err => console.error("Termék hozzáadási hiba:", err));
    });
  }
  
  // Keresősáv: hírek szűrése
  const newsSearchInput = document.getElementById('news-search');
  if (newsSearchInput) {
    newsSearchInput.addEventListener('input', function() {
      loadNews(newsSearchInput.value);
    });
  }
});
