<script lang="ts">
  import PhotoUpload from "$lib/components/PhotoUpload.svelte";
  
  let photoBase64 = $state<string | null>(null);
  let formData = $state({ 
    reporterEmail: '',
    licensePlate: '',
    plateState: 'CA',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '', 
    reason: '72_hours'
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!photoBase64) {
      alert('Please upload photo');
      return;
    }

    console.log('Form data:', { ...formData, photoBase64 });

    // TODO: Send to API endpoint 
    alert('Report Submitted! (API not connected yet)');
  }
</script>

<div class="container">
  <h1>Report Abandonded Vehicle</h1>
  <form onsubmit={handleSubmit}>
    <!-- Photo Upload -->
    <section>
      <label class="label">Vehicle Photo *</label>
      <PhotoUpload bind:onPhotoCompressed={photoBase64} maxSizeKB={500} />
    </section>

    <!-- License Plate -->
    <section>
      <label for="plate" class="label">License Plate *</label>
      <div class="plate-row">
        <input 
          id="plate"
          type="text"
          bind:value={formData.licensePlate}
          required
          placeholder="ABC1234"
          class="plate-input"
        />
        <select bind:value={formData.plateState} class="state-select">
          <option value="CA">CA</option>
          <option value="AZ">AZ</option>
          <option value="NV">NV</option>
          <option value="OR">OR</option>
          <option value="TX">TX</option>
        </select>
      </div>
    </section>

    <!-- Vehicle Details -->
    <section>
      <label for="make" class="label">Make *<label>
        <input 
          id="make"
          type="text"
          bind:value={formData.vehicleMake}
          required
          placeholder="Toyota"
        />  
    </section>

    <section>
      <label for="make" class="label">Model<label>
        <input 
          id="model"
          type="text"
          bind:value={formData.vehicleModel}
          placeholder="Camry"
        />  
    </section>

    <section>
      <label for="color" class="label">Color *<label>
        <input 
          id="color"
          type="text"
          bind:value={formData.vehicleColor}
          required
          placeholder="Silver"
        />  
    </section>

    <!-- Reason -->
    <section>
      <label for="reason" class="label">Reason *</label>
      <select id="reason" bind:value={formData.reason}>
				<option value="72_hours">Parked 72+ hours</option>
				<option value="expired_tags">Expired tags</option>
				<option value="other">Other</option>
      </select>
    </section>

    <!-- Submit -->
    <button type="submit" class="submit-button">Submit Report</button>
  </form>
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: #111827;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .label {
    font-weight: 600;
    color: #374151;
  }

  input,
  select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: #3b82f6;
  }

  .plate-row {
    display: flex;
    gap: 0.5rem;
  }

  .plate-input {
    flex: 1;
    text-transform: uppercase;
  }

  .state-select {
    width: 5rem;
  }

  .submit-button {
    padding: 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-button:hover {
    background-color: #2563eb;
  }

  .submit-button:active {
    background-color: #1d4ed8;
  }
</style>
