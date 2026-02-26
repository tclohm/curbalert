<script lang="ts">
  import { getMakes, getModels } from '@tclohm/iadb';
  
  // Props
  let {
    selectedMake = $bindable(),
    selectedModel = $bindable(),
  }: {
    selectedMake?: string;
    selectedModel?: string;
  } = $props();

  // Local state
  let makeQuery = $state('');
  let modelQuery = $state('');
  let showMakeDropdown = $state(false);
  let showModelDropdown = $state(false);
  let manualEntry = $state(false);
  let makeInputTouched = $state(false); // Track if user has interacted
  let modelInputTouched = $state(false);

  // All available makes
  const allMakes = getMakes();
  
  // Reactive filtering using $derived
  let filteredMakes = $derived(
    makeQuery.length > 0
      ? allMakes.filter(m => m.toLowerCase().includes(makeQuery.toLowerCase())).slice(0, 10)
      : allMakes.slice(0, 10) // Show first 10 makes when empty
  );

  let filteredModels = $derived(
    selectedMake
      ? modelQuery.length > 0
        ? getModels(selectedMake).filter(m => m.toLowerCase().includes(modelQuery.toLowerCase())).slice(0, 10)
        : getModels(selectedMake).slice(0, 10) // Show first 10 models when empty
      : []
  );

  // Show dropdown when there are results (always true now since we show all items)
  $effect(() => {
    // Don't show if we've already selected and the input matches the selection
    if (selectedMake && makeQuery === selectedMake) {
      showMakeDropdown = false;
    } else {
      // Only show if user has interacted with the field
      showMakeDropdown = makeInputTouched && filteredMakes.length > 0 && !manualEntry;
    }
  });

  $effect(() => {
    // Don't show if we've already selected and the input matches the selection
    if (selectedModel && modelQuery === selectedModel) {
      showModelDropdown = false;
    } else {
      // Only show if user has interacted with the field
      showModelDropdown = modelInputTouched && filteredModels.length > 0 && !manualEntry && selectedMake !== '';
    }
  });

  function selectMake(make: string) {
    selectedMake = make;
    makeQuery = make;
    showMakeDropdown = false;
    // Reset model
    selectedModel = '';
    modelQuery = '';
  }

  function selectModel(model: string) {
    selectedModel = model;
    modelQuery = model;
    showModelDropdown = false;
  }

  function handleMakeKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && filteredMakes.length > 0) {
      e.preventDefault();
      selectMake(filteredMakes[0]);
    } else if (e.key === 'Escape') {
      showMakeDropdown = false;
    }
  }

  function handleModelKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && filteredModels.length > 0) {
      e.preventDefault();
      selectModel(filteredModels[0]);
    } else if (e.key === 'Escape') {
      showModelDropdown = false;
    }
  }

  function toggleManual() {
    manualEntry = !manualEntry;
    if (manualEntry) {
      showMakeDropdown = false;
      showModelDropdown = false;
    }
  }
</script>

<div class="vehicle-selector">
  <!-- Manual Entry Toggle -->
  <label class="manual-toggle">
    <input type="checkbox" bind:checked={manualEntry} onchange={toggleManual} />
    <span>Can't find your vehicle? Enter manually</span>
  </label>

  {#if manualEntry}
    <!-- Manual Entry Mode -->
    <div class="form-row">
      <div class="form-group">
        <label for="manual-make">Vehicle Make *</label>
        <input
          id="manual-make"
          type="text"
          bind:value={selectedMake}
          placeholder="e.g., Honda"
        />
      </div>

      <div class="form-group">
        <label for="manual-model">Vehicle Model *</label>
        <input
          id="manual-model"
          type="text"
          bind:value={selectedModel}
          placeholder="e.g., Civic"
        />
      </div>
    </div>
  {:else}
    <!-- Autocomplete Mode -->
    <div class="form-row">
      <!-- Make Selector -->
      <div class="form-group autocomplete-container">
        <label for="make-input">Vehicle Make *</label>
        <div class="input-wrapper">
          <input
            id="make-input"
            type="text"
            bind:value={makeQuery}
            onkeydown={handleMakeKeydown}
            onfocus={() => {
              makeInputTouched = true; // Mark as touched
              // Only show if we haven't selected yet or are changing selection
              if (makeQuery !== selectedMake) {
                showMakeDropdown = true;
              }
            }}
            onblur={() => {
              setTimeout(() => {
                showMakeDropdown = false;
              }, 200);
            }}
            placeholder="Start typing... (e.g., Honda)"
            autocomplete="off"
          />
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {#if showMakeDropdown && filteredMakes.length > 0}
          <div class="dropdown">
            {#each filteredMakes as make}
              <button
                type="button"
                class="dropdown-item"
                onclick={() => selectMake(make)}
              >
                {make}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Model Selector -->
      <div class="form-group autocomplete-container">
        <label for="model-input">Vehicle Model *</label>
        <div class="input-wrapper">
          <input
            id="model-input"
            type="text"
            bind:value={modelQuery}
            onkeydown={handleModelKeydown}
            onfocus={() => {
              modelInputTouched = true; // Mark as touched
              // Only show if we have a make selected and haven't selected a model yet
              if (selectedMake && modelQuery !== selectedModel) {
                showModelDropdown = true;
              }
            }}
            onblur={() => {
              setTimeout(() => {
                showModelDropdown = false;
              }, 200);
            }}
            placeholder={selectedMake ? 'Start typing...' : 'Select make first'}
            autocomplete="off"
            disabled={!selectedMake}
          />
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {#if showModelDropdown && filteredModels.length > 0}
          <div class="dropdown">
            {#each filteredModels as model}
              <button
                type="button"
                class="dropdown-item"
                onclick={() => selectModel(model)}
              >
                {model}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .vehicle-selector {
    width: 100%;
  }

  .manual-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
  }

  .manual-toggle input[type="checkbox"] {
    cursor: pointer;
  }

  .manual-toggle:hover span {
    color: #3b82f6;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .autocomplete-container {
    position: relative;
  }

  label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    padding-right: 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  input:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
    color: #9ca3af;
  }

  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
    pointer-events: none;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-height: 240px;
    overflow-y: auto;
    z-index: 50;
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .dropdown-item {
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    background: none;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s;
    font-size: 1rem;
    font-family: inherit;
    color: inherit;
  }

  .dropdown-item:hover {
    background-color: #eff6ff;
    color: #3b82f6;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
