<script lang="ts">
	import ComingSoon from './coming-soon.svelte';
	import { navItemFor } from './nav.ts';

	const today = navItemFor('')!;
</script>

<svelte:head><title>{today.title()}</title></svelte:head>

<ComingSoon item={today} />
