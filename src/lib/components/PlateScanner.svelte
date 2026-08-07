<script>
  export let plate = "";
  export let state = "";

  let confidence = 0;
  let uploading = false;
  let error = "";

  async function handleUpload(e: Event) {
    const file = e.target.files[0];
    if (!file) return;

    uploading = true;
    error = "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/scan-plate", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success && data.confidence > 0.75) {
        plate = data.plate;
        confidence = data.confidence;
      } else {
        // Low confidence or no detection — leave plate blank, user fills in manually
        plate = "";
        confidence = 0;
      }
    } catch (err) {
      error = "Couldn't scan the image. Enter the plate manually.";
      confidence = 0;
    } finally {
      uploading = false;
    }
  }
</script>

<div class="plate-scanner">
  <label>
    Upload a photo of the plate
    <input type="file" accept="image/*" on:change={handleUpload} disabled={uploading} />
  </label>

  {#if uploading}
    <p>Scanning…</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <label>
    License plate
    <input bind:value={plate} placeholder="License plate" />
  </label>

  <label>
    State
    <select bind:value={state}>
      <option value="">Select state</option>
      <!-- ...options -->
    </select>
  </label>

  {#if confidence > 0}
    <p>Confidence: {(confidence * 100).toFixed(0)}%</p>
  {/if}
</div>

<style>
  .plate-scanner {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .error {
    color: #c0392b;
  }
</style>
