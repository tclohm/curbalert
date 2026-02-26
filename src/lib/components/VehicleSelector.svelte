<script lang="ts">
  import { getMakes, getModels, searchMakes } from '@tclohm/iadb';
  
  let {
    selectedMake = $bindable(),
    selectedModel = $bindable(),
  }: {
    selectedMake?: string;
    selectedModel?: string;
  } = $props();

  // State
  let makeQuery = $state('');
  let modelQuery = $state('');
  let makeDropdownOpen = $state(false);
  let modelDropdownOpen = $state(false);
  let filteredMakes = $state<string[]>([]);
  let filteredModels = $state<string[]>([]);
  let manualEntry = $state(false);
  let highlightedMakeIndex = $state(-1);
  let highlightedModelIndex = $state(-1);

  // Refs
  let makeInputRef: HTMLInputElement;
  let modelInputRef: HTMLInputElement;

  // Update filtered makes when query changes
  $effect(() => {
    if (makeQuery.length === 0) {
      filteredMakes = [];
      makeDropdownOpen = false;
    } else {
      filteredMakes = searchMakes(makeQuery).slice(0, 10);
      makeDropdownOpen = filteredMakes.length > 0 && !manualEntry;
    }
    highlightedMakeIndex = -1;
  });

  // Update filtered models when query changes
  $effect(() => {
    if (!selectedMake || modelQuery.length === 0) {
      filteredModels = [];
      modelDropdownOpen = false;
    } else {
      const allModels = getModels(selectedMake);
      filteredModels = allModels
        .filter(model => model.toLowerCase().includes(modelQuery.toLowerCase()))
        .slice(0, 10);
      modelDropdownOpen = filteredModels.length > 0 && !manualEntry;
    }
    highlightedModelIndex = -1;
  });

  function selectMake(make: string) {
    selectedMake = make;
    makeQuery = make;
    makeDropdownOpen = false;
    selectedModel = '';
    modelQuery = '';
    highlightedMakeIndex = -1;
    // Focus model input after selection
    setTimeout(() => modelInputRef?.focus(), 0);
  }

  function selectModel(model: string) {
    selectedModel = model;
    modelQuery = model;
    modelDropdownOpen = false;
    highlightedModelIndex = -1;
  }

  function handleMakeKeydown(e: KeyboardEvent) {
    if (!makeDropdownOpen || filteredMakes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedMakeIndex = Math.min(highlightedMakeIndex + 1, filteredMakes.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedMakeIndex = Math.max(highlightedMakeIndex - 1, 0);
    } else if (e.key === 'Enter' && highlightedMakeIndex >= 0) {
      e.preventDefault();
      selectMake(filteredMakes[highlightedMakeIndex]);
    } else if (e.key === 'Escape') {
      makeDropdownOpen = false;
    }
  }

  function handleModelKeydown(e: KeyboardEvent) {
    if (!modelDropdownOpen || filteredModels.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedModelIndex = Math.min(highlightedModelIndex + 1, filteredModels.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedModelIndex = Math.max(highlightedModelIndex - 1, 0);
    } else if (e.key === 'Enter' && highlightedModelIndex >= 0) {
      e.preventDefault();
      selectModel(filteredModels[highlightedModelIndex]);
    } else if (e.key === 'Escape') {
      modelDropdownOpen = false;
    }
  }

  function toggleManualEntry() {
    manualEntry = !manualEntry;
    if (manualEntry) {
      makeDropdownOpen = false;
      modelDropdownOpen = false;
      selectedMake = '';
      selectedModel = '';
      makeQuery = '';
      modelQuery = '';
    }
  }

  function handleMakeBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      makeDropdownOpen = false;
    }, 200);
  }

  function handleModelBlur() {
    setTimeout(() => {
      modelDropdownOpen = false;
    }, 200);
  }
</script>

<div class="vehicle-selector">
  <!-- Manual Entry Toggle -->
  <label class="manual-toggle">
    <input type="checkbox" bind:checked={manualEntry} onchange={toggleManualEntry} />
    <span>Can't find your vehicle? Enter manually</span>
  </label>

  {#if manualEntry}
    <!-- Manual Entry Mode -->
    <div class="form-row">
      <div class="form-group">
        <label for="manual-make">Vehicle Make</label>
        <input
          id="manual-make"
          type="text"
          bind:value={selectedMake}
          placeholder="e.g., Honda"
          required
        />
      </div>

      <div class="form-group">
        <label for="manual-model">Vehicle Model</label>
        <input
          id="manual-model"
          type="text"
          bind:value={selectedModel}
          placeholder="e.g., Civic"
          required
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
            bind:this={makeInputRef}
            bind:value={makeQuery}
            onkeydown={handleMakeKeydown}
            onblur={handleMakeBlur}
            onfocus={() => {
              if (makeQuery.length > 0) {
                makeDropdownOpen = true;
              }
            }}
            placeholder="Start typing... (e.g., Honda)"
            autocomplete="off"
            required
          />
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {#if makeDropdownOpen && filteredMakes.length > 0}
          <ul class="dropdown">
            {#each filteredMakes as make, index}
              <li
                class:highlighted={index === highlightedMakeIndex}
                onmousedown={() => selectMake(make)}
                onmouseenter={() => highlightedMakeIndex = index}
              >
                {make}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Model Selector -->
      <div class="form-group autocomplete-container">
        <label for="model-input">Vehicle Model *</label>
        <div class="input-wrapper">
          <input
            id="model-input"
            type="text"
            bind:this={modelInputRef}
            bind:value={modelQuery}
            onkeydown={handleModelKeydown}
            onblur={handleModelBlur}
            onfocus={() => {
              if (modelQuery.length > 0) {
                modelDropdownOpen = true;
              }
            }}
            placeholder={selectedMake ? 'Start typing...' : 'Select make first'}
            autocomplete="off"
            disabled={!selectedMake}
            required
          />
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {#if modelDropdownOpen && filteredModels.length > 0}
          <ul class="dropdown">
            {#each filteredModels as model, index}
              <li
                class:highlighted={index === highlightedModelIndex}
                onmousedown={() => selectModel(model)}
                onmouseenter={() => highlightedModelIndex = index}
              >
                {model}
              </li>
            {/each}
          </ul>
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
    list-style: none;
    padding: 0.25rem;
    margin: 0;
  }

  .dropdown li {
    padding: 0.75rem;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: background-color 0.15s;
  }

  .dropdown li:hover,
  .dropdown li.highlighted {
    background-color: #eff6ff;
    color: #3b82f6;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
