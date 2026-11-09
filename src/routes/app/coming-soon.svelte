<!--
@component
Placeholder for a screen that isn't built yet: its icon, title, a one-line summary and a "coming soon" note.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { HourglassIcon } from 'phosphor-svelte';
	import { toneClasses, type ToneNavItem } from './nav.ts';

	let { item }: { item: ToneNavItem } = $props();
</script>

<section class="flex flex-1 items-center justify-center p-6">
	<div class="flex max-w-md flex-col items-center gap-3 text-center">
		<div class="flex size-12 items-center justify-center rounded-xl {toneClasses[item.tone].tile}">
			<item.icon class="size-6" />
		</div>
		<h2 class="text-xl">{item.title()}</h2>
		<p class="text-muted-foreground">{item.summary()}</p>
		<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<HourglassIcon class="size-4" />
			<span>{m.app_coming_soon()}</span>
		</p>
	</div>
</section>
