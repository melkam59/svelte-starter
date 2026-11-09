<script lang="ts">
	import ComingSoon from '../coming-soon.svelte';
	import { navItemFor } from '../nav.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const item = $derived(navItemFor(data.slug)!);
</script>

<svelte:head><title>{item.title()}</title></svelte:head>

<ComingSoon {item} />
