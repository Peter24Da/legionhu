document.addEventListener("DOMContentLoaded", function() {
    // Mobil navigáció menü megjelenítése/elrejtése
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
  
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  
    // Adomány űrlap kezelése (példa, itt csak egy alert jelenik meg)
    const donationForm = document.getElementById('donation-form');
    donationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Itt lehetne AJAX hívást indítani a backend felé, hogy feldolgozza az adatokat
      alert("Köszönjük az adományát!");
      donationForm.reset();
    });
  });
  