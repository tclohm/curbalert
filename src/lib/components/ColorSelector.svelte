<script lang="ts">
  import { allColors, searchByName } from '@tclohm/car-colors';
  
  let {
    selectedColor = $bindable(),
  }: {
    selectedColor?: string;
  } = $props();

  // Local state
  let colorQuery = $state('');
  let showColorDropdown = $state(false);
  let colorInputTouched = $state(false);

  // Get the selected color object for hex value
  let selectedColorObj = $derived(
    selectedColor ? allColors.find(c => c.name === selectedColor) : null
  );

  // Reactive filtering using $derived
  let filteredColors = $derived(
    colorQuery.length > 0
      ? searchByName(colorQuery).slice(0, 10)
      : allColors.slice(0, 10) // Show first 10 colors when empty
  );

  // Show dropdown when there are results
  $effect(() => {
    // Don't show if we've already selected and the input matches the selection
    if (selectedColor && colorQuery === selectedColor) {
      showColorDropdown = false;
    } else {
      // Only show if user has interacted with the field
      showColorDropdown = colorInputTouched && filteredColors.length > 0;
    }
  });

  function selectColor(colorName: string) {
    selectedColor = colorName;
    colorQuery = colorName;
    showColorDropdown = false;
  }

  function handleColorKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && filteredColors.length > 0) {
      e.preventDefault();
      selectColor(filteredColors[0].name);
    } else if (e.key === 'Escape') {
      showColorDropdown = false;
    }
  }
</script>

<div class="color-selector">
  <div class="form-group autocomplete-container">
    <label for="color-input">Color *</label>
    <div class="input-wrapper">
      {#if selectedColorObj}
        <span class="color-preview" style="background-color: {selectedColorObj.hex}"></span>
      {/if}
      <input
        id="color-input"
        type="text"
        class:has-color={selectedColorObj !== null}
        bind:value={colorQuery}
        onkeydown={handleColorKeydown}
        onfocus={() => {
          colorInputTouched = true;
          // Only show if we haven't selected yet or are changing selection
          if (colorQuery !== selectedColor) {
            showColorDropdown = true;
          }
        }}
        onblur={() => {
          setTimeout(() => {
            showColorDropdown = false;
          }, 200);
        }}
        placeholder="Start typing... (e.g., Silver)"
        autocomplete="off"
      />
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </div>

    {#if showColorDropdown && filteredColors.length > 0}
      <div class="dropdown">
        {#each filteredColors as color}
          <button
            type="button"
            class="dropdown-item"
            onclick={() => selectColor(color.name)}
          >
            <span class="color-swatch" style="background-color: {color.hex}"></span>
            {color.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .color-selector {
    width: 100%;
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

  .color-preview {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
    pointer-events: none;
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

  input.has-color {
    padding-left: 2.5rem;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .dropdown-item:hover {
    background-color: #eff6ff;
    color: #3b82f6;
  }

  .color-swatch {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
    flex-shrink: 0;
  }
</style>
