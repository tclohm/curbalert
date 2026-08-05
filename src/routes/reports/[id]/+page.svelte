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
      hasVoted = true; // already voted from another tab/session with same token
    }
  }

  onMount(load);
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>❌ {error}</p>
{:else}
  <div class="detail-container">
    <h1>{report.plate_state} {report.license_plate}</h1>
    <p>{report.vehicle_make} {report.vehicle_model} — {report.vehicle_color}</p>
    <p>Status: {report.status}</p>
    <p>Reported {report.report_count}× total</p>
    <p>{report.address}</p>
    {#if report.notes}<p>{report.notes}</p>{/if}

    <button onclick={upvote} disabled={hasVoted || voting} class="upvote-btn">
      👍 {hasVoted ? 'Validated' : 'Validate this report'} ({report.vote_count})
    </button>

    {#if canEdit}
      <a href={`/edit/${localStorage.getItem('editUrl')?.split('/').pop()}`} class="edit-btn">
        Edit this report
      </a>
    {/if}
  </div>
{/if}
