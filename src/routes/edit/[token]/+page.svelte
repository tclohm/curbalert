<script lang="ts">
  import { page } from '$app/state';
  const token = page.params.token;

  let reports = $state<any[]>([]);
  let loading = $state(true);
  let savingId = $state<string | null>(null);
  let savedId = $state<string | null>(null);

  function getStatusColor(status: string) {
    switch (status) {
      case 'open': return 'status-open';
      case 'investigating': return 'status-investigating';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  async function load() {
    const res = await fetch(`/api/reports/edit/${token}`);
    const data = await res.json();
    reports = res.ok ? data.reports : [];
    loading = false;
  }

  async function save(r: any) {
    savingId = r.id;
    savedId = null;
    await fetch(`/api/reports/edit/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: r.id, notes: r.notes, reason: r.reason, address: r.address })
    });
    savingId = null;
    savedId = r.id;
    setTimeout(() => { if (savedId === r.id) savedId = null; }, 2000);
  }

  load();
</script>

<div class="container">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading your reports...</p>
    </div>
  {:else if reports.length === 0}
    <div class="empty-state">
      <p>No reports found for this link.</p>
    </div>
  {:else}
    <header>
      <h1>Your Reports</h1>
      <p class="subtitle">Update the details on any report you've submitted</p>
    </header>

    <div class="reports-list">
      {#each reports as r (r.id)}
        <div class="report-card">
          <div class="card-header">
            <div class="plate-badge">
              <span class="plate-state">{r.plate_state}</span>
              <span class="plate-number">{r.license_plate}</span>
            </div>
            <div class="header-right">
              <span class="status-badge {getStatusColor(r.status)}">{r.status}</span>
              <a href={`/reports/${r.id}`} class="view-link">View →</a>
            </div>
          </div>

          <label class="field">
            <span class="field-label">Address</span>
            <input bind:value={r.address} placeholder="Street address" />
          </label>

          <label class="field">
            <span class="field-label">Notes</span>
            <textarea bind:value={r.notes} rows="3" placeholder="Any additional details"></textarea>
          </label>

          <div class="card-footer">
            <button
              onclick={() => save(r)}
              disabled={savingId === r.id}
              class="save-button"
            >
              {savingId === r.id ? 'Saving...' : 'Save'}
            </button>
            {#if savedId === r.id}
              <span class="saved-text">✓ Saved</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    margin-bottom: 1.5rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #6b7280;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: #6b7280;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .report-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .plate-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
  }

  .plate-state {
    padding: 0.25rem 0.5rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .plate-number {
    font-family: monospace;
    letter-spacing: 0.05em;
    font-size: 0.95rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-open {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .status-investigating {
    background-color: #fef3c7;
    color: #92400e;
  }

  .status-closed {
    background-color: #d1fae5;
    color: #065f46;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .field-label {
    font-weight: 600;
    color: #374151;
    font-size: 0.8125rem;
  }

  input,
  textarea {
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    font-family: inherit;
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .save-button {
    padding: 0.625rem 1.25rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .save-button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .save-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .saved-text {
    color: #065f46;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .view-link {
    color: #3b82f6;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }

  .view-link:hover {
    text-decoration: underline;
  }

</style>
