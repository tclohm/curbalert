<script lang="ts">
  import { getAll } from '@tclohm/us-states';

	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import VehicleSelector from '$lib/components/VehicleSelector.svelte';
	import SelectDropdown from '$lib/components/SelectDropdown.svelte';
  import ColorSelector from '$lib/components/ColorSelector.svelte';

  // Get all us states and convert to SelectDropdown format 
  const stateOptions = getAll().map(state => ({
    value: state.abbr,
    label: state.abbr
  }));

	let photoBase64 = $state<string | null>(null);
	let selectedMake = $state('');
	let selectedModel = $state('');
  let selectedColor = $state('');
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);
  let isGettingLocation = $state(false);

	let formData = $state({
		reporterEmail: '',
		licensePlate: '',
		plateState: 'CA',
		vehicleColor: '',
		reason: '72_hours',
		notes: '', 
    address: '',
    latitude: null as number | null,
    longitude: null as number | null
	});

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      submitError = 'Geolocation is not supported by your browser';
      return;
    }

    isGettingLocation = true;
    submitError = null;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        formData.latitude = position.coords.latitude;
        formData.longitude = position.coords.longitude;

        // Reverse geocode to get address 
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${formData.latitude}&lon=${formData.longitude}&format=json`
          );
          const data = await response.json();

          if (data.display_name) {
            formData.address = data.display_name;
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          formData.address = `${formData.latitude}, ${formData.longitude}`;
        }

        isGettingLocation = false;
      },
      (error) => {
        isGettingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
						submitError = 'Location permission denied. Please enter address manually.';
						break;
					case error.POSITION_UNAVAILABLE:
						submitError = 'Location unavailable. Please enter address manually.';
						break;
					case error.TIMEOUT:
						submitError = 'Location request timed out. Please enter address manually.';
						break;
					default:
						submitError = 'Could not get location. Please enter address manually.';        
        }
      }
    );
  }

	async function handleSubmit(event: Event) {
		event.preventDefault();
		submitError = null;
		submitSuccess = false;

		if (!photoBase64) {
			submitError = 'Please upload a photo';
			return;
		}

		if (!selectedMake || !selectedModel) {
			submitError = 'Please select vehicle make and model';
			return;
		}

    if (!selectedColor) {
      submitError = 'Please select vehicle color';
      return;
    }

    if (!formData.address) {
      submitError = 'Please enter the vehicle location';
      return;
    }

		isSubmitting = true;

		try {
			const response = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					vehicleMake: selectedMake,
					vehicleModel: selectedModel,
          vehicleColor: selectedColor,
					photoBase64
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit report');
			}

			submitSuccess = true;

			// Reset form
			formData = {
				reporterEmail: '',
				licensePlate: '',
				plateState: 'CA',
				vehicleColor: '',
				reason: '72_hours',
				notes: '',
        address: '',
        latitude: null,
        longitude: null
			};
			photoBase64 = null;
			selectedMake = '';
			selectedModel = ''; 
      selectedColor = '';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Failed to submit report';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="container">
	<h1>Report Abandoned Vehicle</h1>
	<p class="subtitle">Help keep Los Angeles streets clean and safe</p>

	{#if submitSuccess}
		<div class="success-message">
			✅ Report submitted successfully! Thank you for helping keep LA clean.
		</div>
	{/if}

	{#if submitError}
		<div class="error-message">
			❌ {submitError}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<!-- Photo Upload -->
		<section>
			<label for="photo" class="label">Vehicle Photo *</label>
			<PhotoUpload bind:onPhotoCompressed={photoBase64} maxSizeKB={500} />
		</section>

		<!-- Vehicle Selector with Autocomplete -->
		<section>
			<VehicleSelector bind:selectedMake bind:selectedModel />
		</section>

    <!-- Color Selector -->
    <section>
      <ColorSelector bind:selectedColor />
    </section>

    <!-- Location -->
    <section>
      <label for="address" class="label">Vehicle Location *</label>
        <div class="location-container">
				  <button 
					  type="button" 
					  class="location-button"
					  onclick={getCurrentLocation}
					  disabled={isGettingLocation}
				  >
					  {#if isGettingLocation}
						  <span class="spinner"></span>
						  Getting location...
					  {:else}
						  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="location-icon">
							  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
							  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
						  </svg>
						  Use Current Location
					  {/if}
				  </button>
				<input
					id="address"
					type="text"
					bind:value={formData.address}
					placeholder="Or enter address manually"
					required
				/>
			</div>
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
				<div class="state-select">
					<SelectDropdown
						options={stateOptions}
						bind:selected={formData.plateState}
            placeholder="CA"
					/>
				</div>
			</div>
		</section>

		<!-- Reason -->
		<section>
			<label for="reason" class="label">Reason *</label>
			<SelectDropdown
				options={[
					{ value: '72_hours', label: 'Parked 72+ hours' },
					{ value: 'expired_tags', label: 'Expired tags' },
					{ value: 'other', label: 'Other' }
				]}
				bind:selected={formData.reason}
			/>
		</section>

		<!-- Notes -->
		<section>
			<label for="notes" class="label">Additional Notes</label>
			<textarea
				id="notes"
				bind:value={formData.notes}
				placeholder="Any additional details..."
				rows="3"
			/>
		</section>

		<!-- Email -->
		<section>
			<label for="email" class="label">Your Email *</label>
			<input
				id="email"
				type="email"
				bind:value={formData.reporterEmail}
				required
				placeholder="you@example.com"
			/>
		</section>

		<!-- Submit -->
		<button type="submit" class="submit-button" disabled={isSubmitting}>
			{isSubmitting ? 'Submitting...' : 'Submit Report'}
		</button>
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
		margin-bottom: 0.5rem;
		color: #111827;
	}

	.subtitle {
		color: #6b7280;
		margin-bottom: 2rem;
	}

	.success-message {
		padding: 1rem;
		background-color: #d1fae5;
		color: #065f46;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.error-message {
		padding: 1rem;
		background-color: #fee2e2;
		color: #991b1b;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
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
	textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

  .location-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.location-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.location-button:hover:not(:disabled) {
		background-color: #e5e7eb;
		border-color: #9ca3af;
	}

	.location-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.location-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid #d1d5db;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
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

	.submit-button:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.submit-button:active:not(:disabled) {
		background-color: #1d4ed8;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
