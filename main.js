// main.js - minimal JS for accessibility & AJAX placeholder
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const nav = document.getElementById('navlist');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', (!expanded).toString());
      nav.style.display = expanded ? 'none' : 'flex';
    });
  }

  // Form: prevent default and prepare AJAX payload (placeholder)
  const form = document.querySelector('.trip-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      // Convert to simple object
      const payload = {};
      for (const [k,v] of formData.entries()) {
        // Multiple checkboxes with same name will be overwritten in this simple approach.
        // In real integration, handle arrays properly.
        payload[k] = v;
      }
      // Placeholder: here you'd call fetch('/api/itinerary', {method:'POST', body: JSON.stringify(payload)})
      console.log('AJAX payload prepared (prototype):', payload);

      // Accessible feedback (replace with ARIA live region in production)
      alert('Custom itinerary request prepared (demo). This would be sent to server via AJAX.');
    });
  }
});
