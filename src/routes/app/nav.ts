import type { Component } from 'svelte';
import { ClockCounterClockwiseIcon, GearIcon, HouseIcon, NoteIcon, UsersIcon } from 'phosphor-svelte';
import { m } from '#lib/paraglide/messages.js';

/** One screen in the app sidebar. */
export interface NavItem {
	/** URL segment under /app; '' is the home page. */
	slug: string;
	/** The screen's name in the current language. */
	title: () => string;
	icon: Component;
	/** One line on what the screen is for, in the current language. */
	summary: () => string;
}

/** The color of a sidebar section. The colors are defined in layout.css. */
export type NavTone = 'overview' | 'content' | 'admin';

/** A titled section of the sidebar. */
export interface NavGroup {
	/** The section's name in the current language. */
	title: () => string;
	tone: NavTone;
	items: NavItem[];
}

/** The classes for each section color, written out in full so Tailwind includes them. */
export const toneClasses: Record<NavTone, { icon: string; tile: string }> = {
	overview: { icon: 'text-nav-overview', tile: 'bg-nav-overview/10 text-nav-overview' },
	content: { icon: 'text-nav-content', tile: 'bg-nav-content/10 text-nav-content' },
	admin: { icon: 'text-nav-admin', tile: 'bg-nav-admin/10 text-nav-admin' }
};

/**
 * Every sidebar section and screen, in display order. Add a screen here and it shows as
 * "coming soon" at /app/<slug> until you create `src/routes/app/<slug>/+page.svelte`.
 */
export const navGroups: NavGroup[] = [
	{
		title: m.nav_group_overview,
		tone: 'overview',
		items: [{ slug: '', title: m.nav_home, icon: HouseIcon, summary: m.nav_home_summary }]
	},
	{
		title: m.nav_group_content,
		tone: 'content',
		items: [{ slug: 'example', title: m.nav_example, icon: NoteIcon, summary: m.nav_example_summary }]
	},
	{
		title: m.nav_group_admin,
		tone: 'admin',
		items: [
			{ slug: 'activity', title: m.nav_activity, icon: ClockCounterClockwiseIcon, summary: m.nav_activity_summary },
			{ slug: 'members', title: m.nav_members, icon: UsersIcon, summary: m.nav_members_summary },
			{ slug: 'settings', title: m.nav_settings, icon: GearIcon, summary: m.nav_settings_summary }
		]
	}
];

export type ToneNavItem = NavItem & { tone: NavTone };

/** Every sidebar screen in one list, each with its section color. */
export const navItems: ToneNavItem[] = navGroups.flatMap((group) =>
	group.items.map((item) => ({ ...item, tone: group.tone }))
);

/** Finds the sidebar screen for a URL segment. */
export function navItemFor(slug: string): ToneNavItem | undefined {
	return navItems.find((item) => item.slug === slug);
}

/** Returns the link for a sidebar screen. */
export function hrefFor(item: NavItem): `/app${string}` {
	return item.slug ? `/app/${item.slug}` : '/app';
}
