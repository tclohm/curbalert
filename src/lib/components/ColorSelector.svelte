<script lang="ts">
  import { getColors } from '@tclohm/car-colors';
  
  let {
    selectedColor = $bindable(),
  }: {
    selectedColor?: string;
  } = $props();

  // Local state
  let colorQuery = $state('');
  let showColorDropdown = $state(false);
  let colorInputTouched = $state(false);

  // All available colors
  const allColors = getColors();
  
  // Reactive filtering using $derived
  let filteredColors = $derived(
    colorQuery.length > 0
      ? allColors.filter(c => c.toLowerCase().includes(colorQuery.toLowerCase())).slice(0, 10)
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

  function selectColor(color: string) {
    selectedColor = color;
    colorQuery = color;
    showColorDropdown = false;
  }

  function handleColorKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && filteredColors.length > 0) {
      e.preventDefault();
      selectColor(filteredColors[0]);
    } else if (e.key === 'Escape') {
      showColorDropdown = false;
    }
  }
</script>

<div class="color-selector">
  <div class="form-group autocomplete-container">
    <label for="color-input">Color *</label>
    <div class="input-wrapper">
      <input
        id="color-input"
        type="text"
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
            onclick={() => selectColor(color)}
          >
            {color}
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
</style>
