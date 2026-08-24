// Admin UI helpers: sidebar drawer toggle and overlay
(function(){
  function initAdminUI(){
    // find existing overlay (support both legacy 'site-overlay' and new 'sidebar-overlay')
    let overlay = document.querySelector('.sidebar-overlay, .site-overlay, #site-overlay');
    if (overlay) {
      // ensure it has the styling class the CSS expects
      if (!overlay.classList.contains('sidebar-overlay')) overlay.classList.add('sidebar-overlay');
    } else {
      // create overlay if missing
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    // ensure nav button exists only on pages with a sidebar
    let btn = document.getElementById('navMenuBtn');
    const hasSidebar = !!document.querySelector('.sidebar');
    if(!btn && hasSidebar){
      btn = document.createElement('button');
      btn.id = 'navMenuBtn';
      btn.className = 'nav-menu-button';
      btn.setAttribute('aria-label','Toggle menu');
      btn.innerHTML = '☰ Menu';
      document.body.appendChild(btn);
    }

    function openSidebar(){
      document.body.classList.add('sidebar-open');
      btn.setAttribute('aria-expanded','true');
    }
    function closeSidebar(){
      document.body.classList.remove('sidebar-open');
      btn.setAttribute('aria-expanded','false');
    }

    if (btn) {
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        document.body.classList.toggle('sidebar-open');
        btn.setAttribute('aria-expanded', document.body.classList.contains('sidebar-open'));
      });
    }

    // clicking overlay closes
    overlay.addEventListener('click', function(){ closeSidebar(); });

    // pressing ESC closes
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeSidebar(); });

    // clicking outside sidebar closes when open
    document.addEventListener('click', function(e){
      if(!document.body.classList.contains('sidebar-open')) return;
      if(e.target.closest && e.target.closest('.sidebar')) return;
      if(e.target.closest && e.target.closest('#navMenuBtn')) return;
      closeSidebar();
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initAdminUI);
  else initAdminUI();
})();
