<script lang="ts">
	import { dev } from '$app/env';
	import { page } from '$app/state';
	import DataToggle from '#lib/components/dev/data-toggle.svelte';
	import { navUserFixtures, navUserStates } from './nav-user.fixtures.ts';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import AppSidebar from './app-sidebar.svelte';
	import SiteHeader from './site-header.svelte';
	import { navItemFor } from './nav.ts';

	let { children, data } = $props();

	// In development, `?data=` in the URL swaps in a test person.
	const me = $derived((dev && navUserFixtures[page.url.searchParams.get('data') ?? '']) || data.me);

	const title = $derived(
		navItemFor(page.url.pathname.replace(/^\/app\/?/, '').split('/')[0])?.title() ??
			page.data.appName
	);
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 64); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" {me} />
	<Sidebar.Inset>
		<SiteHeader {title} />
		<div class="flex flex-1 flex-col">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
{#if dev}
	<DataToggle states={navUserStates} />
{/if}
