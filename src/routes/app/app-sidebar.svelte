<!--
@component
The app's side navigation: the app's logo, the screens grouped by area, and the user menu.
-->
<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AppLogo from '#lib/components/app-logo.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { hrefFor, navGroups, toneClasses, type NavItem } from './nav.ts';
	import NavUser from './nav-user.svelte';

	let {
		me,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		me: { name: string; email: string; roleName: string };
	} = $props();

	function isActive(item: NavItem): boolean {
		const href = hrefFor(item);
		return item.slug === ''
			? page.url.pathname === href
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" tooltipContent={page.data.appName}>
					{#snippet child({ props })}
						<a href={resolve('/app')} {...props}>
							<AppLogo name={page.data.appName} class="size-8 rounded-lg" />
							<span class="truncate text-base">{page.data.appName}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		{#each navGroups as group (group.tone)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.title()}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.slug)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={isActive(item)} tooltipContent={item.title()}>
									{#snippet child({ props })}
										<a
											href={resolve(hrefFor(item) as Path)}
											aria-current={isActive(item) ? 'page' : undefined}
											{...props}
										>
											<item.icon class={toneClasses[group.tone].icon} />
											<span>{item.title()}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {me} />
	</Sidebar.Footer>
</Sidebar.Root>
