<!--
	@component
	A switch between demo and test data, kept in `?data=` in the URL. Development only.
-->
<script lang="ts">
	import { page } from '$app/state';

	let { states }: { states: { value: string; label: string }[] } = $props();

	const current = $derived(page.url.searchParams.get('data') ?? states[0]?.value);

	function hrefFor(value: string): string {
		const url = new URL(page.url.href);
		if (value === states[0]?.value) url.searchParams.delete('data');
		else url.searchParams.set('data', value);
		return url.pathname + url.search;
	}
</script>

<nav
	aria-label="Test data"
	style="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;gap:2px;padding:3px;border-radius:999px;background:#e5e5e5;font:12px system-ui,sans-serif"
>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- dev chrome, same-page query links -->
	{#each states as state (state.value)}
		<a
			href={hrefFor(state.value)}
			data-sveltekit-replacestate
			aria-current={current === state.value ? 'true' : undefined}
			style="padding:4px 12px;border-radius:999px;color:#222;text-decoration:none;{current ===
			state.value
				? 'background:#fff'
				: ''}">{state.label}</a
		>
	{/each}
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</nav>
