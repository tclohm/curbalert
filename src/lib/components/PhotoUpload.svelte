<script lang="ts">
  import { compressImageToBase64, validateImageFile, getBase64Size } from '$lib/utils/imageCompression';
	import { allowedNodeEnvironmentFlags } from 'node:process';
  
  let {
    onPhotoCompressed = $bindable(),
    maxSizeKB = 500
  }: {
    onPhotoCompressed?: string | null;
    maxSizeKB?: number;
  } = $props();

  let fileInput: HTMLInputElement; 
  let previewUrl = $state<string | null>(null);
  let isCompressing = $state(false);
  let error = $state<string | null>(null);
  let compressionStats = $state<{ originalKB: number; compressedKB: number } | null>(null);

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // reset state 
    error = null;
    compressionStats = null; 
    previewUrl = null;
    onPhotoCompressed = null;
    
    // validate file 
    const validation = validateImageFile(file);
    if (!validation.valid) {
      error = validation.error;
      return;
    }

    isCompressing = true;

    try {
      // compress 
      const base64 = await compressImageToBase64(file, {
        maxSizeKB, 
        maxWidth: 1920, 
        quality: 0.8,
      }); 

      // set preview 
      previewUrl = base64;
      onPhotoCompressed = base64;
      
      // Show compression stats 
      compressionStats = {
        originalKB: Math.round(file.size / 1024),
        compressedKB: Math.round(getBase64Size(base64))
      };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to compress image';
      console.error('Compression error:', e);
    } finally {
      isCompressing = false;
    }
  }

  function clearPhoto() {
    previewUrl = null; 
    onPhotoCompressed = null;
    error = null;
    compressionStats = null; 
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="photo-upload">
  <!-- Upload Button -->
  {#if !previewUrl}
    <label fro ="photo-input" class="upload-button">
      <svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="icon"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
				/>
			</svg>
      {isCompressing ? 'Compressing...' : 'Take or Upload Photo'} 
    </label> 
    <input 
      id="photo-input"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      capture="environment"
      bind:this={fileInput}
      onchange={handleFileSelect}
      disabled={isCompressing}
      class="hidden"
    />
  {/if} 

  <!-- Preview -->
  {#if previewUrl}
    <div class="preview-container">
      <img src={previewUrl} alt="Vehicle photo" class="preview-image" />
      <button type="button" onclick={clearPhoto} class="remove-button"> Remove Photo </button>
    </div>
  {/if} 

  <!-- Compression Stats -->
  {#if compressionStats}
    <p class="stats"> 
      Compressed from {compressionStats.originalKB} KB -> {compressionStats.compressedKB} KB
    </p>
  {/if}

  <!-- Error Message -->
  {#if error}
    <p class="error">{error}</p>
  {/if} 

  <style>
    .photo-upload {
      width: 100%;
    }

    .upload-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem; 
      width: 100%;
      padding: 2rem; 
      border: 2px dashed #d1d5db;
      border-radius: 0.5rem;
      background-color: #f9fafb;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-button:hover {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .icon {
      width: 3rem;
      height: 3rem;
      color: #6b7280;
    }

    .hidden {
      display: none;
    }

    .preview-container {
      position: relative; 
      width: 100%; 
      border-radius: 0.5rem; 
      overflow: hidden;
    }

    .preview-image {
      width: 100%; 
      height: auto; 
      display: block; 
    }

    .remove-button {
      position: absolute; 
      top: 0.5rem; 
      right: 0.5rem;
      padding: 0.5rem 1rem; 
      background-color: rgba(239, 68, 68, 0.9);
      color: white; 
      border: none; 
      border-radius: 0.375rem; 
      cursor: pointer; 
      font-weight: 500;
    }

    .remove-button:hover {
      background-color: rgba(220, 38, 38, 0.9);
    }

    .stats {
      margin-top: 0.5rem; 
      font-size: 0.875rem; 
      color: #059669;
    }

    .error {
      margin-top: 0.5rem; 
      color: #dc2626;
      font-size: 0.875rem;
    }
  </style>
</div>
