/** Something that happened, to add to the Activity log. Only `type` is required. */
export interface ActivityEvent {
	/** What happened, such as `auth.signed_in`. */
	type: string;
	/** The member who did it; leave out for anonymous events. */
	actorMemberId?: string | null;
	ip?: string | null;
	/** The record it happened to. */
	entity?: { type: string; id: string };
	before?: unknown;
	after?: unknown;
	reason?: string;
}

/** One Activity log entry as the screens see it. */
export interface ActivityEntry {
	id: string;
	createdAt: Date;
	type: string;
	actorMemberId: string | null;
	ip: string | null;
	entityType: string | null;
	entityId: string | null;
	before: unknown;
	after: unknown;
	reason: string | null;
}
