<!--
@component
The app's logo. Replace the favicon in `src/lib/assets/` with your own.
-->
<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { cn } from '#lib/utils.js';

	let { name, class: className }: { name: string; class?: string } = $props();
</script>

<img src={favicon} alt={name} class={cn('shrink-0', className)} />
