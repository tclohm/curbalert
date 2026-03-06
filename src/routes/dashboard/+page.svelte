<script lang="ts">
	import { onMount } from 'svelte';

	type Report = {
		id: number;
		vehicleMake: string;
		vehicleModel: string;
		vehicleColor: string;
		licensePlate: string;
		plateState: string;
		address: string;
		reason: string;
		notes: string | null;
		status: 'open' | 'investigating' | 'closed';
		createdAt: number;
		updatedAt: number;
	};

	let reports = $state<Report[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filters
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'open' | 'investigating' | 'closed'>('all');

	// Filtered reports
	let filteredReports = $derived(
		reports.filter(report => {
			// Status filter
			if (statusFilter !== 'all' && report.status !== statusFilter) {
				return false;
			}

			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					report.licensePlate.toLowerCase().includes(query) ||
					report.vehicleMake.toLowerCase().includes(query) ||
					report.vehicleModel.toLowerCase().includes(query) ||
					report.vehicleColor.toLowerCase().includes(query) ||
					report.address.toLowerCase().includes(query)
				);
			}

			return true;
		})
	);

	onMount(async () => {
		try {
			const response = await fetch('/api/reports');
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load reports');
			}

			reports = data.reports;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load reports';
		} finally {
			loading = false;
		}
	});

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

	function formatDate(timestamp: number) {
		return new Date(timestamp * 1000).toLocaleDateString('en-US', {
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
				placeholder="Search by plate, make, model, color, or address..."
			/>
		</div>

		<div class="status-filters">
			<button
				class="filter-btn"
				class:active={statusFilter === 'all'}
				onclick={() => statusFilter = 'all'}
			>
				All ({reports.length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'open'}
				onclick={() => statusFilter = 'open'}
			>
				Open ({reports.filter(r => r.status === 'open').length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'investigating'}
				onclick={() => statusFilter = 'investigating'}
			>
				Investigating ({reports.filter(r => r.status === 'investigating').length})
			</button>
			<button
				class="filter-btn"
				class:active={statusFilter === 'closed'}
				onclick={() => statusFilter = 'closed'}
			>
				Closed ({reports.filter(r => r.status === 'closed').length})
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading reports...</p>
		</div>
	{:else if error}
		<div class="error-message">
			❌ {error}
		</div>
	{:else if filteredReports.length === 0}
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
					{#each filteredReports as report}
						<tr>
							<td class="plate-cell">
								<span class="plate-badge">
									<span class="plate-state">{report.plateState}</span>
									<span class="plate-number">{report.licensePlate}</span>
								</span>
							</td>
							<td class="vehicle-cell">
								<div class="vehicle-name">{report.vehicleMake} {report.vehicleModel}</div>
							</td>
							<td>{report.vehicleColor}</td>
							<td class="address-cell">
								<div class="address-text">{report.address}</div>
							</td>
							<td>{getReasonLabel(report.reason)}</td>
							<td>
								<span class="status-badge {getStatusColor(report.status)}">
									{report.status}
								</span>
							</td>
							<td class="date-cell">{formatDate(report.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="results-count">
			Showing {filteredReports.length} of {reports.length} reports
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

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
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
