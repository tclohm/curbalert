<script lang="ts">
  import { getAll } from '@tclohm/us-states';

	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import VehicleSelector from '$lib/components/VehicleSelector.svelte';
	import SelectDropdown from '$lib/components/SelectDropdown.svelte';

  // Get all us states and convert to SelectDropdown format 
  const stateOptions = getAll().map(state => ({
    value: state.abbr,
    label: state.abbr
  }));

	let photoBase64 = $state<string | null>(null);
	let selectedMake = $state('');
	let selectedModel = $state('');
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);

	let formData = $state({
		reporterEmail: '',
		licensePlate: '',
		plateState: 'CA',
		vehicleColor: '',
		reason: '72_hours',
		notes: ''
	});

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

		isSubmitting = true;

		try {
			const response = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					vehicleMake: selectedMake,
					vehicleModel: selectedModel,
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
				notes: ''
			};
			photoBase64 = null;
			selectedMake = '';
			selectedModel = '';
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

		<!-- Vehicle Color -->
		<section>
			<label for="color" class="label">Color *</label>
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
