<script lang="ts">
	import { dev } from '$app/env';
	import { m } from '#lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import {
		CircleNotchIcon,
		EyeIcon,
		EyeSlashIcon,
		SignInIcon,
		WarningCircleIcon
	} from 'phosphor-svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { page } from '$app/state';
	import AppLogo from '#lib/components/app-logo.svelte';
	import { errorMessage, fieldMessages } from '#lib/shared/error-message.ts';
	import type { PageProps } from './$types';

	let { data, form: actionForm }: PageProps = $props();

	const form = $derived(actionForm);

	// Demo accounts from `pnpm db:seed`, shown only in development.
	const demoAccounts = [
		{ role: 'Owner', email: 'owner@demo.com' },
		{ role: 'Admin', email: 'admin@demo.com' },
		{ role: 'Member', email: 'member@demo.com' }
	];
	let emailInput: HTMLInputElement | null = $state(null);
	let passwordInput: HTMLInputElement | null = $state(null);

	function useDemo(email: string) {
		if (!emailInput || !passwordInput) return;
		emailInput.value = email;
		passwordInput.value = '12345678';
		passwordInput.form?.requestSubmit();
	}

	let pending = $state(false);
	let showPassword = $state(false);

	const emailErrors = $derived(form?.error ? fieldMessages(form.error, 'email') : []);
	const passwordErrors = $derived(form?.error ? fieldMessages(form.error, 'password') : []);
	// Field problems show under each field; any other problem shows once above the form.
	const formError = $derived(
		form?.error && !form.error.fieldErrors ? errorMessage(form.error) : null
	);
</script>

<svelte:head>
	<title>{m.sign_in_title()}</title>
</svelte:head>

<main class="grid min-h-svh bg-background">
	<div class="flex items-center justify-center px-4 py-12">
		<div class="flex w-full max-w-sm flex-col gap-6">
			<header class="flex flex-col items-center gap-3 text-center">
				<AppLogo name={data.appName} class="size-11 rounded-xl" />
				<p class="text-sm font-medium">{data.appName}</p>
				<div class="flex flex-col gap-1">
					<h1 class="text-2xl">{m.sign_in_title()}</h1>
					
				</div>
			</header>

			<form
				method="POST"
				novalidate
				class="flex flex-col gap-5 rounded-xl border bg-card p-6"
				use:enhance={() => {
					pending = true;
					return async ({ result, update }) => {
						// A full page load after sign-in, so the app opens in the member's own language.
						if (result.type === 'redirect') {
							window.location.assign(result.location);
							return;
						}
						await update({ reset: false });
						pending = false;
					};
				}}
			>
				{#if formError}
					<div
						role="alert"
						class="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
					>
						<WarningCircleIcon class="mt-0.5 size-4 shrink-0" />
						<span>{formError}</span>
					</div>
				{/if}

				<div class="flex flex-col gap-2">
					<Label for="email">{m.sign_in_email()}</Label>
					<Input
						id="email"
						name="email"
						type="email"
						inputmode="email"
						autocomplete="username"
						spellcheck={false}
						required
						value={form?.email ?? ''}
						bind:ref={emailInput}
						aria-invalid={emailErrors.length > 0 || undefined}
						aria-describedby={emailErrors.length > 0 ? 'email-error' : undefined}
					/>
					{#if emailErrors.length > 0}
						<p id="email-error" class="text-sm text-destructive">{emailErrors[0]}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					<Label for="password">{m.sign_in_password()}</Label>
					<div class="relative">
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:ref={passwordInput}
							class="pe-10"
							aria-invalid={passwordErrors.length > 0 || undefined}
							aria-describedby={passwordErrors.length > 0 ? 'password-error' : undefined}
						/>
						<!-- Centered with flex, because the button moves itself 1px down while pressed. -->
						<span class="absolute inset-y-0 end-0.5 flex items-center">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								class="text-muted-foreground"
								aria-label={showPassword ? m.sign_in_hide_password() : m.sign_in_show_password()}
								aria-pressed={showPassword}
								onclick={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<EyeSlashIcon />
								{:else}
									<EyeIcon />
								{/if}
							</Button>
						</span>
					</div>
					{#if passwordErrors.length > 0}
						<p id="password-error" class="text-sm text-destructive">{passwordErrors[0]}</p>
					{/if}
				</div>

				<Button type="submit" size="lg" class="w-full" disabled={pending}>
					{#if pending}
						<CircleNotchIcon class="animate-spin" />
						{m.sign_in_pending()}
					{:else}
						<SignInIcon />
						{m.sign_in_title()}
					{/if}
				</Button>
			</form>

			<p class="text-center text-sm text-muted-foreground">
				{m.sign_in_forgot()}
			</p>

			{#if dev}
				<section class="flex flex-col gap-2 rounded-xl bg-muted p-4" aria-labelledby="demo-heading">
					<h2 id="demo-heading" class="text-sm text-muted-foreground">
						Demo accounts · password 12345678
					</h2>
					<div class="grid grid-cols-3 gap-2">
						{#each demoAccounts as account (account.email)}
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={pending}
								onclick={() => useDemo(account.email)}
							>
								{account.role}
							</Button>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>

</main>

