<!--
@component
The signed-in member's menu at the foot of the sidebar: who they are, their Role, theme, language and sign out.
-->
<script lang="ts">
	import { roleLabel } from '#lib/shared/role-name.ts';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { CaretUpDownIcon, DesktopIcon, MoonIcon, SignOutIcon, SunIcon } from 'phosphor-svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale, type Locale } from '#lib/paraglide/runtime.js';
	import { saveLanguage } from './language.remote.ts';

	interface Me {
		name: string;
		email: string;
		roleName: string;
	}

	let { me }: { me: Me } = $props();

	const sidebar = Sidebar.useSidebar();

	const themes = [
		{ value: 'light', label: m.user_menu_theme_light, icon: SunIcon },
		{ value: 'dark', label: m.user_menu_theme_dark, icon: MoonIcon },
		{ value: 'system', label: m.user_menu_theme_system, icon: DesktopIcon }
	] as const;
	type Theme = (typeof themes)[number]['value'];

	function chooseTheme(value: string) {
		if (themes.some((t) => t.value === value)) setMode(value as Theme);
	}

	// Each language is named in its own script, so member can find theirs whichever language is showing.
	const languageNames: Record<Locale, string> = { en: 'English', am: 'አማርኛ' };
	const currentLanguage = getLocale();

	// Saves the choice to the member first, so it follows them to their next sign-in, then reloads in it.
	async function chooseLanguage(value: string) {
		const locale = locales.find((l) => l === value);
		if (!locale || locale === currentLanguage) return;
		await saveLanguage(locale);
		setLocale(locale);
	}

	let signOutForm: HTMLFormElement | undefined = $state();

	const initials = $derived(
		me.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || '?'
	);
</script>

{#snippet avatar()}
	<span
		class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs text-sidebar-accent-foreground"
		aria-hidden="true"
	>
		{initials}
	</span>
{/snippet}

<!-- Signing out needs a form post, so a link or a preloaded page can't sign anyone out. -->
<form method="POST" action="/sign-out" bind:this={signOutForm} class="hidden"></form>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						{@render avatar()}
						<span class="grid min-w-0 flex-1 text-start text-sm leading-tight">
							<span class="truncate">{me.name}</span>
							<span class="truncate text-xs text-muted-foreground">{roleLabel(me.roleName)}</span>
						</span>
						<CaretUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0">
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						{@render avatar()}
						<span class="grid min-w-0 flex-1 leading-tight">
							<span class="truncate">{me.name}</span>
							<span class="truncate text-xs text-muted-foreground">{me.email}</span>
						</span>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading class="text-xs text-muted-foreground"
						>{m.user_menu_theme()}</DropdownMenu.GroupHeading
					>
					<DropdownMenu.RadioGroup value={userPrefersMode.current} onValueChange={chooseTheme}>
						{#each themes as theme (theme.value)}
							<DropdownMenu.RadioItem value={theme.value} closeOnSelect={false}>
								<theme.icon />
								{theme.label()}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading class="text-xs text-muted-foreground"
						>{m.user_menu_language()}</DropdownMenu.GroupHeading
					>
					<DropdownMenu.RadioGroup value={currentLanguage} onValueChange={chooseLanguage}>
						{#each locales as locale (locale)}
							<DropdownMenu.RadioItem value={locale} lang={locale} closeOnSelect={false}>
								{languageNames[locale]}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => signOutForm?.requestSubmit()}>
					<SignOutIcon />
					{m.user_menu_sign_out()}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
