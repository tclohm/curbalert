<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types'; 

  let { form }: { form: ActionData } = $props();
  let submitting = $state(false);
</script>
<div class="wrap">
  <form 
    method="POST"
    class="card"
    use:enhance={() => { // special dom acces to element
      return async ({ update }) => {
        await update();
        submitting = false;
      };  
    }}
  >
    <h1>Admin Login</h1>
    
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if} 

    <label>
      Email
      <input type="email" name="email" required autocomplete="username" />
    </label>

    <label>
      Password
      <input type="password" name="password" required autocomplete="current-password" />
    </label>
    <button type="submit" disabled={submitting}>
      {submitting ? 'Signing in...' : 'Sign in'}
    </button>
  </form>
</div>

<style>
  button {
    padding: 0.7rem;
    border: none;
    border-radius: 8px;
    background: #111827;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .card {
    width: 100%;
    max-width: 360px;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
  }

  .error {
    background: #fef2f2;
    color: #991b1b;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin: 0;
  }

  input {
    padding: 0.6rem 0.7rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
  } 

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .wrap {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

</style>
