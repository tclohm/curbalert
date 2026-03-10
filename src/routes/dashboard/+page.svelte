
<script lang="ts">
  import { onMount } from "svelte";

	type Report = {
    id: number;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_color: string;
    license_plate: string;
    plate_state: string;
    address: string;
    reason: string;
    notes: string | null;
    status: 'open' | 'investigating' | 'closed';
    created_at: string | null;
    updated_at: string | null;
	};

	let reports = $state<Report[]>([]);
	let loading = $state(true);     // only true on first load
  let refreshing = $state(false); // true on subsequent fetches
	let error = $state<string | null>(null);

	// Filters
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'open' | 'investigating' | 'closed'>('all');

  // Pagination state 
  let currentPage = $state(1);
  let totalPages = $state(1);
  let total = $state(0);
  const LIMIT = 20;

  async function loadReports(page = 1) {
    // never clear reports - let old results stay visible
    if (reports.length === 0) {
      loading = true;
    } else {
      refreshing = true
    }

    // Capture the search/filter values at time of request 
    // to avoid race conditions if user keeps typing
    const requestSearch = searchQuery;
    const requestStatus = statusFilter;
    const requestPage = page;

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search: requestSearch, 
        status: requestStatus
      });

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load reports');

      // Only update if this response is still relevant
      // (user hasn't changed search again while we were fetching)
      if (requestSearch === searchQuery && requestStatus == statusFilter) {
        reports = data.reports; 
        total = data.total;
        totalPages = data.totalPages;
        currentPage = data.page;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadReports(1), 150);
  }

  onMount(() => loadReports(1))

  let pageNumbers = $derived( 
    Array.from({ length: totalPages }, (_, i) => i + 1)
  );

	function getStatusColor(status: string) {
		switch (status) {
			case 'open':
				return 'status-open';
			case 'investigating':
				return 'status-investigating';
			case 'closed':
				return 'status-closed';
			default:
				return '';
		}
	}

	function getReasonLabel(reason: string) {
		switch (reason) {
			case '72_hours':
				return 'Parked 72+ hours';
			case 'expired_tags':
				return 'Expired tags';
			case 'other':
				return 'Other';
			default:
				return reason;
		}
	}

	function formatDate(timestamp: string | null) {
    if (!timestamp) return '-';
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="container">
	<header>
		<h1>Reported Vehicles Dashboard</h1>
		<p class="subtitle">View all abandoned vehicle reports in Los Angeles</p>
	</header>

	<!-- Filters -->
	<div class="filters">
		<div class="search-box">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
        oninput={handleSearch}
				placeholder="Search by plate, make, model, color, or address..."
			/>
		</div>

		<div class="status-filters">
			<button
				class="filter-btn"
				class:active={statusFilter === 'all'}
				onclick={() => { statusFilter = 'all'; loadReports(1); }}
			>
				All ({reports.length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'open'}
				onclick={() => { statusFilter = 'open'; loadReports(1); }}
			>
				Open ({reports.filter(r => r.status === 'open').length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'investigating'}
				onclick={() => { statusFilter = 'investigating'; loadReports(1); }}
			>
				Investigating ({reports.filter(r => r.status === 'investigating').length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'closed'}
				onclick={() => { statusFilter = 'closed'; loadReports(1); }}
			>
				Closed ({reports.filter(r => r.status === 'closed').length})
			</button>
		</div>
	</div>

  <!-- Subtle refresh indicator below search box -->
  <div class="refresh-bar" class:visible={refreshing}></div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading reports...</p>
		</div>
	{:else if error}
		<div class="error-message">
			❌ {error}
		</div>
	{:else if reports.length === 0}
		<div class="no-results">
			{#if searchQuery || statusFilter !== 'all'}
				<p>No reports match your filters</p>
			{:else}
				<p>No reports yet</p>
			{/if}
		</div>
	{:else}
		<div class="table-container">
			<table class="reports-table">
				<thead>
					<tr>
						<th>License Plate</th>
						<th>Vehicle</th>
						<th>Color</th>
						<th>Location</th>
						<th>Reason</th>
						<th>Status</th>
						<th>Reported</th>
					</tr>
				</thead>
				<tbody>
					{#each reports as report}
						<tr>
							<td class="plate-cell">
								<span class="plate-badge">
									<span class="plate-state">{report.plate_state}</span>
									<span class="plate-number">{report.license_plate}</span>
								</span>
							</td>
							<td class="vehicle-cell">
								<div class="vehicle-name">{report.vehicle_make} {report.vehicle_model}</div>
							</td>
							<td>{report.vehicle_color}</td>
							<td class="address-cell">
								<div class="address-text">{report.address}</div>
							</td>
							<td>{getReasonLabel(report.reason)}</td>
							<td>
								<span class="status-badge {getStatusColor(report.status)}">
									{report.status}
								</span>
							</td>
							<td class="date-cell">{formatDate(report.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

    {#if totalPages > 1}
      <div class="pagination">
        <button
            class="page-btn"
            disabled={currentPage === 1}
            onclick={() => loadReports(currentPage - 1)}
        >
            ← Prev
        </button>

        {#each pageNumbers as n}
            <button
                class="page-btn"
                class:active={n === currentPage}
                onclick={() => loadReports(n)}
            >
                {n}
            </button>
        {/each}

        <button
            class="page-btn"
            disabled={currentPage === totalPages}
            onclick={() => loadReports(currentPage + 1)}
        >
            Next →
        </button>
      </div>
    {/if}

		<div class="results-count">
			Showing {(currentPage - 1) * LIMIT + 1}-{Math.min(currentPage * LIMIT, total)} of {total} reports
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
	}

	.filters {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.search-box {
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.25rem;
		height: 1.25rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 0.75rem 0.75rem 0.75rem 3rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.search-box input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.status-filters {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.filter-btn:hover {
		border-color: #9ca3af;
	}

	.filter-btn.active {
		background-color: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		color: #6b7280;
	}

  .refresh-bar {
    height: 2px;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    background-size: 200% 100%;
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.2s;
    margin-bottom: 1rem;
    animation: shimmer 1.2s infinite;
  }

  .refresh-bar.visible {
    opacity: 1;
  }
	
  .spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

  .table-container.dimmed {
    opacity: 0.6;
    transition: opacity 0.15s;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		padding: 1rem;
		background-color: #fee2e2;
		color: #991b1b;
		border-radius: 0.5rem;
		text-align: center;
	}

	.no-results {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	.table-container {
		overflow-x: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
	}

	.reports-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.reports-table thead {
		background-color: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
	}

	.reports-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		white-space: nowrap;
	}

	.reports-table td {
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
		vertical-align: middle;
	}

	.reports-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.reports-table tbody tr:last-child td {
		border-bottom: none;
	}

	.plate-cell {
		white-space: nowrap;
	}

	.plate-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
	}

	.plate-state {
		padding: 0.25rem 0.5rem;
		background-color: #3b82f6;
		color: white;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.plate-number {
		font-family: monospace;
		letter-spacing: 0.05em;
		font-size: 0.95rem;
	}

	.vehicle-cell {
		font-weight: 500;
	}

	.vehicle-name {
		white-space: nowrap;
	}

	.address-cell {
		max-width: 300px;
	}

	.address-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #6b7280;
	}

	.date-cell {
		white-space: nowrap;
		color: #6b7280;
		font-size: 0.8125rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
		white-space: nowrap;
	}

	.status-open {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.status-investigating {
		background-color: #fef3c7;
		color: #92400e;
	}

	.status-closed {
		background-color: #d1fae5;
		color: #065f46;
	}

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }

  .page-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s;
    min-width: 2.5rem;
  }

  .page-btn:hover:not(:disabled) {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .page-btn.active {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

	.results-count {
		margin-top: 1rem;
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.table-container {
			border-radius: 0;
			border-left: none;
			border-right: none;
		}

		.reports-table {
			font-size: 0.8125rem;
		}

		.reports-table th,
		.reports-table td {
			padding: 0.75rem 0.5rem;
		}

		.address-cell {
			max-width: 200px;
		}
	}
</style>
