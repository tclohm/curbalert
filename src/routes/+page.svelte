<script lang="ts">
  import PhotoUpload from "$lib/components/PhotoUpload.svelte";
  
  let photoBase64 = $state<string | null>(null);
  let formData = $state({ 
    reporterEmail: '',
    licensePlate: '',
    plateState: 'CA',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '', 
    reason: '72_hours'
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!photoBase64) {
      alert('Please upload photo');
      return;
    }

    console.log('Form data:', { ...formData, photoBase64 });

    // TODO: Send to API endpoint 
    alert('Report Submitted! (API not connected yet)');
  }
</script>

