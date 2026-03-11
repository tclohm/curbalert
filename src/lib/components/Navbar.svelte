<script lang="ts">
  import { page } from '$app/stores';
  let currentPath = $derived($page.url.pathname);
</script>

<nav class="navbar">
  <div class="navbar-inner">
    <a href="/" class="wordmark">
      <span class="curb">CURB</span><span class="alert">ALERT</span>
      <span class="city">· LA</span>
    </a>

    <div class="nav-links">
      <a href="/" class="nav-link" class:active={currentPath === '/'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
          Report
      </a>
      <a href="/dashboard" class="nav-link" class:active={currentPath === '/dashboard'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
        </svg>
          Dashboard
      </a>
    </div>
  </div>
</nav>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500&display=swap');

    .navbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: #0f172a;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        box-shadow: 0 1px 20px rgba(0,0,0,0.3);
    }

    .navbar-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1.5rem;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .wordmark {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 1.35rem;
        letter-spacing: 0.02em;
        text-decoration: none;
        display: flex;
        align-items: baseline;
        gap: 0.1em;
    }

    .curb {
        color: #ffffff;
    }

    .alert {
        color: #f97316;
    }

    .city {
        font-size: 0.75rem;
        font-weight: 500;
        color: #64748b;
        letter-spacing: 0.05em;
        margin-left: 0.25rem;
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.85rem;
        border-radius: 0.375rem;
        font-family: 'Barlow', sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        color: #94a3b8;
        text-decoration: none;
        transition: all 0.15s;
        letter-spacing: 0.01em;
    }

    .nav-link svg {
        width: 1rem;
        height: 1rem;
    }

    .nav-link:hover {
        color: #ffffff;
        background-color: rgba(255,255,255,0.06);
    }

    .nav-link.active {
        color: #f97316;
        background-color: rgba(249, 115, 22, 0.1);
    }
</style>
