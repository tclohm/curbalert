<script lang="ts">
  import { compressImageToBase64, validateImageFile, getBase64Size } from '$lib/utils/imageCompression';
  
  let {
    onPhotoCompressed = $bindable(),
    maxSizeKB = 500
  }: {
    onPhotoCompressed?: string | null;
    maxSizeKB?: number;
  } = $props();

  let fileInput: HTMLInputElement; 
  let previewUrl = $state<string | null>(null);
  let isCompressing = $state
</script>
