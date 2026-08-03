<script lang="ts">
  import { page } from '$app/state';

  let report = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let saving = $state(false);
  let saved = $state(false);

  const token = page.params.token;

  async function load() {
    const res = await fetch(`/api/reports/edit/${token}`);
    const data = await res.json();
    if (!res.ok) { error = data.error; loading = false; return; }
    report = data.report;
    loading = false;
  }

  async function save() {
    saving = true;
    saved = false;
    const res = await fetch(`/api/reports/edit/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: report.notes, reason: report.reason, address: report.address })
    });
    saving = false;
    if (res.ok) saved = true;
  }

  load();
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>❌ {error}</p>
{:else}
  <h1>Edit your report</h1>
  <p>{report.vehicle_make} {report.vehicle_model} — {report.license_plate} ({report.plate_state})</p>
  <p>Current status: {report.status}</p>

  <label>
    Address
    <input bind:value={report.address} />
  </label>

  <label>
    Reason
    <select bind:value={report.reason}>
      <option value="72_hours">Parked 72+ hours</option>
      <option value="expired_tags">Expired tags</option>
      <option value="other">Other</option>
    </select>
  </label>

  <label>
    Notes
    <textarea bind:value={report.notes}></textarea>
  </label>

  <button onclick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
  {#if saved}<p>✅ Saved</p>{/if}
{/if}
