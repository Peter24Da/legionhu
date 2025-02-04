document.addEventListener("DOMContentLoaded", function() {
  // Mobil navigáció
  const menuToggle = document.getElementById('mobile-menu');
  const navMenu = document.getElementById('nav-menu');

  menuToggle.addEventListener('click', function() {
    navMenu.classList.toggle('active');
  });

  // Adomány űrlap kezelése
  const donationForm = document.getElementById('donation-form');
  donationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Köszönjük az adományát!");
    donationForm.reset();
  });

  // Hírek lekérése a főoldali hírfolyamhoz
  function loadNewsIndex() {
    fetch('/api/news')
      .then(response => response.json())
      .then(data => {
        const newsContainer = document.getElementById('news-container');
        if (newsContainer) {
          newsContainer.innerHTML = '';
          data.forEach(item => {
            // Időpont formázása: YYYY-MM-DD HH:MM
            let formatted = "";
            if (item.timestamp) {
              const date = new Date(item.timestamp);
              formatted = date.getFullYear() + '-' +
                          ('0' + (date.getMonth()+1)).slice(-2) + '-' +
                          ('0' + date.getDate()).slice(-2) + ' ' +
                          ('0' + date.getHours()).slice(-2) + ':' +
                          ('0' + date.getMinutes()).slice(-2);
            }
            let mediaHtml = '';
            if (item.media) {
              if (item.media.match(/\.(jpg|jpeg|png|gif)$/i)) {
                mediaHtml = `<img src="${item.media}" alt="Media" style="max-width:100px;">`;
              } else if (item.media.match(/youtube\.com|youtu\.be/)) {
                function getYouTubeEmbedUrl(url) {
                  var regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
                  var match = url.match(regExp);
                  if (match && match[1].length === 11) {
                    return 'https://www.youtube.com/embed/' + match[1] + '?rel=0';
                  } else {
                    return null;
                  }
                }
                const embedUrl = getYouTubeEmbedUrl(item.media);
                mediaHtml = embedUrl 
                  ? `<div class="responsive-iframe">
                       <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                     </div>` 
                  : `<a href="${item.media}" target="_blank">${item.media}</a>`;
              } else if (item.media.match(/\.(mp4|webm)$/i)) {
                mediaHtml = `<video src="${item.media}" width="100" muted style="cursor:pointer;" onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>`;
              } else {
                mediaHtml = `<a href="${item.media}" target="_blank">${item.media}</a>`;
              }
            }
            const article = document.createElement('article');
            article.classList.add('news-item');
            article.innerHTML = `<h3>${item.title} (${formatted})</h3><p>${item.content}</p>${mediaHtml}`;
            newsContainer.appendChild(article);
          });
        }
      })
      .catch(err => console.error("Hiba a hírek betöltésekor:", err));
  }

  loadNewsIndex();
  // Ha szeretnéd frissíteni az adatokat időközönként, beállíthatsz egy időzítőt
  // setInterval(loadNewsIndex, 30000);
});
