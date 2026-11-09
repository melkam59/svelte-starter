<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { issueMessages } from '#lib/shared/error-message.ts';
	import { newId } from '#lib/shared/ids.ts';
	import { noteForm, notes } from './notes.remote.ts';

	const PAGE_SIZE = 5;

	// Each page after the first starts where the one before it stopped.
	let cursors = $state<(string | undefined)[]>([undefined]);
	let noteId = $state(newId());
</script>

<svelte:head><title>Example notes</title></svelte:head>

<section class="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
	<header>
		<h2 class="text-xl">Example notes</h2>
		<p class="text-muted-foreground">
			A development screen showing how a module is built. It is not part of the app.
		</p>
	</header>

	<form
		class="flex flex-col gap-2"
		{...noteForm.enhance(async ({ element, submit }) => {
			if (!(await submit())) return;
			element.reset();
			noteId = newId();
			cursors = [undefined];
		})}
	>
		<input {...noteForm.fields.id.as('hidden', noteId)} />
		<Label for="body">Note</Label>
		<div class="flex gap-2">
			<Input id="body" {...noteForm.fields.body.as('text')} />
			<Button type="submit" disabled={!!noteForm.pending}>Add</Button>
		</div>
		{#each issueMessages(noteForm.fields.body.issues()) as message (message)}
			<p class="text-sm text-destructive">{message}</p>
		{/each}
	</form>

	<ul class="flex flex-col divide-y">
		{#each cursors as cursor, index (cursor ?? 'first')}
			{@const page = await notes({ limit: PAGE_SIZE, cursor })}
			{#each page.items as note (note.id)}
				<li class="py-3">
					<p>{note.body}</p>
					<p class="text-sm text-muted-foreground">{note.authorName}</p>
				</li>
			{:else}
				{#if index === 0}<li class="py-3 text-muted-foreground">No notes yet.</li>{/if}
			{/each}
			{#if index === cursors.length - 1 && page.nextCursor}
				<li class="pt-3">
					<Button variant="outline" onclick={() => cursors.push(page.nextCursor!)}>Load more</Button
					>
				</li>
			{/if}
		{/each}
	</ul>
</section>
