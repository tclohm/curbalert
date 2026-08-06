<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  const reportId = page.params.id;

  let report = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let canEdit = $state(false);
  let voterToken = $state<string | null>(null);
  let hasVoted = $state(false);
  let voting = $state(false);

  function getOrCreateVoterToken(): string {
    let token = localStorage.getItem('voterToken');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('voterToken', token);
    }
    return token;
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'open': return 'status-open';
      case 'investigating': return 'status-investigating';
      case 'closed': return 'statsu-closed';
      default: return '';
    }
  }

  function getReasonLabel(reason: string) {
    switch (reason) {
      case '72_hours': return 'Parked 72+ hours';
      case 'expired_tags': return 'Expired tags';
      default: return 'Other';
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  async function load() {
    voterToken = getOrCreateVoterToken();
    const editUrl = localStorage.getItem('editUrl');
    const editToken = editUrl ? editUrl.split('/').pop() : '';
    
    const params = new URLSearchParams({ voterToken });
    if (editToken) params.set('editToken', editToken);

    const res = await fetch(`/api/reports/${reportId}?${params}`);
    const data = await res.json();
    if (!res.ok) { error = data.error; loading = false; return; }

    report = data.report;
    hasVoted = data.hasVoted;
    canEdit = data.canEdit;
    loading = false;
  }

  async function upvote() {
    if (hasVoted || voting) return;
    voting = true;
    const res = await fetch(`/api/reports/${reportId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterToken })
    });
    voting = false;
    if (res.ok) {
      hasVoted = true;
      report.vote_count += 1;
    } else if (res.status === 409) {
      hasVoted = true; 
    }
  }

  function wasEdited(created: string | null, updated: string | null): boolean {
    if (!created || !updated) return false;
    const gapMs = new Date(updated).getTime() - new Date(created).getTime();
    return gapMs > 60_000; // more than a minute apart = a real edit, not insert jitter
  }

  function editHref() {
    const editUrl = localStorage.getItem('editUrl');
    if (!editUrl) return '#';
    return editUrl.startsWith('/') ? editUrl : `/${editUrl}`;
  }

  onMount(load);
</script>

<div class="container">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading report...</p>
    </div>
  {:else if error}
    <div class="error-message">❌ {error}</div>
    <a href="/dashboard" class="back-link">← Back to dashboard</a>
  {:else}
    <a href="/dashboard" class="back-link">← Back to dashboard</a>

    <header>
      <div class="plate-badge">
        <span class="plate-state">{report.plate_state}</span>
        <span class="plate-number">{report.license_plate}</span>
      </div>
      {#if report.report_count > 1}
        <span class="report-count-badge">Reported {report.report_count}×</span>
      {/if}
    </header>

    <h1>{report.vehicle_make} {report.vehicle_model}</h1>

    <div class="meta-row">
      <span class="status-badge {getStatusColor(report.status)}">{report.status}</span>
      <span class="date-text">
        Reported {formatDate(report.created_at)}
        {#if wasEdited(reported.created_at, reported.updated_at)}
              · Edited {formatDate(report.updated_at)}
        {/if}
      </span>
    </div>

    <div class="detail-card">
      <div class="detail-row">
        <span class="detail-label">Color</span>
        <span>{report.vehicle_color}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location</span>
        <span>{report.address}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reason</span>
        <span>{getReasonLabel(report.reason)}</span>
      </div>
      {#if report.notes}
        <div class="detail-row">
          <span class="detail-label">Notes</span>
          <span>{report.notes}</span>
        </div>
      {/if}
    </div>

    {#if report.photo_base64}
      <img src={report.photo_base64} alt="Reported vehicle" class="vehicle-photo" />
    {/if}

    <div class="actions">
      <button onclick={upvote} disabled={hasVoted || voting} class="upvote-button" class:voted={hasVoted}>
        👍 {hasVoted ? 'Validated' : 'Validate this report'} ({report.vote_count})
      </button>

      {#if canEdit}
        <a href={editHref()} class="edit-button">Edit this report</a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    text-decoration: none;
  }

  .back-link:hover {
    color: #3b82f6;
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

  .error-message {
    padding: 1rem;
    background-color: #fee2e2;
    color: #991b1b;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
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

  .report-count-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background-color: #fef3c7;
    color: #92400e;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.75rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
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

  .date-text {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .detail-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .detail-label {
    font-weight: 600;
    color: #374151;
    font-size: 0.8125rem;
  }

  .vehicle-photo {
    width: 100%;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .upvote-button {
    padding: 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .upvote-button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .upvote-button.voted {
    background-color: #d1fae5;
    color: #065f46;
    cursor: default;
  }

  .upvote-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .edit-button {
    display: block;
    text-align: center;
    padding: 0.875rem;
    background-color: white;
    color: #3b82f6;
    border: 1px solid #3b82f6;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 0.2s;
  }

  .edit-button:hover {
    background-color: #eff6ff;
  }
</style>
