<script lang="ts">
  import { page } from '$app/state';
  const token = page.params.token;
  let reports = $state<any[]>([]);
  let loading = $state(true);

  async function load() {
    const res = await fetch(`/api/reports/edit/${token}`);
    const data = await res.json();
    reports = res.ok ? data.reports : [];
    loading = false;
  }

  async function save(r: any) {
    await fetch(`/api/reports/edit/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: r.id, notes: r.notes, reason: r.reason, address: r.address })
    });
  }

  load();
</script>

{#if loading}
  <p>Loading...</p>
{:else if reports.length === 0}
  <p>No reports found for this link.</p>
{:else}
  <h1>Your Reports</h1>
  {#each reports as r}
    <div class="report-card">
      <strong>{r.plate_state} {r.license_plate}</strong> — {r.status}
      <input bind:value={r.address} />
      <textarea bind:value={r.notes}></textarea>
      <button onclick={() => save(r)}>Save</button>
    </div>
  {/each}
{/if}
