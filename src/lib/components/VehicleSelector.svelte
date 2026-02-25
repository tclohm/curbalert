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

  // Ref 
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
    highlightedModelIndex = -1;
  });

  // Update filtered models when query changes 
  $effect(() => {
    if (!selectedMake || modelQuery.length === 0) {
      filteredModels = [];
      modelDropdownOpen = false;
    } else { 
      const allModels = getModels(selectedMake); 
      filteredModels = allModels.filter(model => model.toLowerCase().includes(modelQuery.toLowerCase())).slice(0,10);
      modelDropdownOpen = filteredModels.length > 0 && !manualEntry;
    }
    highlightedModelIndex = -1;
  })

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
