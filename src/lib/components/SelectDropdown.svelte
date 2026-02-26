<script lang="ts">
  type Option = {
    value: string;
    label: string;
  };

  let {
    options,
    selected = $bindable(),
    placeholder = 'Select...',
    disabled = false,
  }: {
    options: Option[];
    selected?: string;
    placeholder?: string;
    disabled?: boolean;
  } = $props();

  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement;

  // Get the label for the selected value
  let selectedLabel = $derived(
    options.find(opt => opt.value === selected)?.label || placeholder
  );

  function selectOption(value: string) {
    selected = value;
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      isOpen = false;
      buttonRef?.focus();
    }
  }

  function toggleDropdown() {
    if (!disabled) {
      isOpen = !isOpen;
    }
  }
</script>

<div class="select-dropdown" class:disabled>
  <button
    type="button"
    class="select-button"
    class:open={isOpen}
    bind:this={buttonRef}
    onclick={toggleDropdown}
    onblur={() => {
      setTimeout(() => isOpen = false, 200);
    }}
    {disabled}
  >
    <span class="selected-text">{selectedLabel}</span>
    <svg 
      class="chevron-icon" 
      class:rotated={isOpen}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke-width="1.5" 
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  </button>

  {#if isOpen && !disabled}
    <div class="dropdown" onkeydown={handleKeydown}>
      {#each options as option}
        <button
          type="button"
          class="dropdown-item"
          class:selected={option.value === selected}
          onclick={() => selectOption(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .select-dropdown {
    position: relative;
    width: 100%;
  }

  .select-dropdown.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    padding-right: 2.5rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    font-family: inherit;
  }

  .select-button:hover:not(:disabled) {
    border-color: #9ca3af;
  }

  .select-button:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .select-button:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
    color: #9ca3af;
  }

  .selected-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
    transition: transform 0.2s;
    pointer-events: none;
  }

  .chevron-icon.rotated {
    transform: translateY(-50%) rotate(180deg);
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

  .dropdown-item.selected {
    background-color: #dbeafe;
    color: #3b82f6;
    font-weight: 500;
  }
</style>
