import { pgTable, index, foreignKey, check, serial, varchar, text, timestamp, integer, date, numeric, boolean, jsonb, uniqueIndex, unique, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const postType = pgEnum("post_type", ['post', 'nota', 'blog'])


export const collaborations = pgTable("collaborations", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	collaborationType: varchar("collaboration_type").notNull(),
	genre: varchar(),
	skills: text(),
	budget: varchar(),
	deadline: timestamp({ mode: 'string' }),
	status: varchar().default('active'),
	responseCount: integer("response_count").default(0),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_collaborations_collaboration_type").using("btree", table.collaborationType.asc().nullsLast().op("text_ops")),
	index("idx_collaborations_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_collaborations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_collaborations_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "collaborations_user_id_fkey"
		}).onDelete("cascade"),
	check("collaborations_collaboration_type_check", sql`(collaboration_type)::text = ANY ((ARRAY['musician'::character varying, 'producer'::character varying, 'composer'::character varying, 'choreographer'::character varying, 'other'::character varying])::text[])`),
	check("collaborations_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])`),
]);

export const hiringRequests = pgTable("hiring_requests", {
	id: serial().primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	artistId: integer("artist_id"),
	venueId: integer("venue_id"),
	details: text().notNull(),
	eventDate: date("event_date"),
	status: varchar().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	budget: numeric({ precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "hiring_requests_client_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [artists.id],
			name: "hiring_requests_artist_id_artists_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "hiring_requests_venue_id_venues_id_fk"
		}),
]);

export const hiringResponses = pgTable("hiring_responses", {
	id: serial().primaryKey().notNull(),
	requestId: integer("request_id").notNull(),
	artistId: integer("artist_id").notNull(),
	proposal: text().notNull(),
	message: text(),
	status: varchar().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.requestId],
			foreignColumns: [hiringRequests.id],
			name: "hiring_responses_request_id_hiring_requests_id_fk"
		}),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [artists.id],
			name: "hiring_responses_artist_id_artists_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	senderId: varchar("sender_id").notNull(),
	receiverId: varchar("receiver_id").notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}),
]);

export const ticketTypes = pgTable("ticket_types", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('COP'),
	quantity: integer().notNull(),
	soldCount: integer("sold_count").default(0),
	saleStart: timestamp("sale_start", { mode: 'string' }),
	saleEnd: timestamp("sale_end", { mode: 'string' }),
	minPerOrder: integer("min_per_order").default(1),
	maxPerOrder: integer("max_per_order").default(10),
	isActive: boolean("is_active").default(true),
	requiresApproval: boolean("requires_approval").default(false),
	allowSeatSelection: boolean("allow_seat_selection").default(false),
	customFields: jsonb("custom_fields").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_ticket_types_event_id").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("idx_ticket_types_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "ticket_types_event_id_fkey"
		}).onDelete("cascade"),
]);

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	artistId: integer("artist_id"),
	eventId: integer("event_id"),
	venueId: integer("venue_id"),
	type: varchar().notNull(),
	score: numeric().notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [artists.id],
			name: "reviews_artist_id_artists_id_fk"
		}),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "reviews_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "reviews_venue_id_venues_id_fk"
		}),
]);

export const recommendations = pgTable("recommendations", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	artistId: integer("artist_id"),
	eventId: integer("event_id"),
	venueId: integer("venue_id"),
	type: varchar().notNull(),
	score: numeric({ precision: 3, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	postId: integer("post_id"),
	title: varchar().notNull(),
	content: text().notNull(),
	isApproved: boolean("is_approved").default(true),
	likeCount: integer("like_count").default(0),
	replyCount: integer("reply_count").default(0),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "recommendations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "recommendations_post_id_blog_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [artists.id],
			name: "recommendations_artist_id_artists_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "recommendations_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "recommendations_venue_id_venues_id_fk"
		}).onDelete("cascade"),
]);

export const seats = pgTable("seats", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	section: varchar({ length: 50 }).notNull(),
	row: varchar({ length: 10 }).notNull(),
	number: varchar({ length: 10 }).notNull(),
	status: varchar({ length: 20 }).default('available'),
	ticketTypeId: integer("ticket_type_id"),
	metadata: jsonb().default({}),
	reservedBy: varchar("reserved_by"),
	reservedAt: timestamp("reserved_at", { mode: 'string' }),
	reservationExpiry: timestamp("reservation_expiry", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_seats_event_id").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("idx_seats_event_status").using("btree", table.eventId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("int4_ops")),
	index("idx_seats_reserved_by").using("btree", table.reservedBy.asc().nullsLast().op("text_ops")),
	index("idx_seats_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_seats_ticket_type_id").using("btree", table.ticketTypeId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("idx_seats_unique_location").using("btree", table.eventId.asc().nullsLast().op("int4_ops"), table.section.asc().nullsLast().op("int4_ops"), table.row.asc().nullsLast().op("text_ops"), table.number.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "seats_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ticketTypeId],
			foreignColumns: [ticketTypes.id],
			name: "seats_ticket_type_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reservedBy],
			foreignColumns: [users.id],
			name: "seats_reserved_by_fkey"
		}).onDelete("set null"),
	check("seats_status_check", sql`(status)::text = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'sold'::character varying, 'blocked'::character varying])::text[])`),
]);

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar().notNull(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	displayName: varchar("display_name"),
	profileImageUrl: varchar("profile_image_url"),
	coverImageUrl: varchar("cover_image_url"),
	userType: varchar("user_type").default('general').notNull(),
	bio: text(),
	city: varchar(),
	address: text(),
	phone: varchar(),
	website: varchar(),
	socialMedia: jsonb("social_media"),
	isVerified: boolean("is_verified").default(false),
	isFeatured: boolean("is_featured").default(false),
	isAvailable: boolean("is_available").default(true),
	rating: numeric({ precision: 3, scale:  2 }).default('0.00'),
	totalReviews: integer("total_reviews").default(0),
	fanCount: integer("fan_count").default(0),
	preferences: jsonb().default({}),
	settings: jsonb().default({}),
	lastActive: timestamp("last_active", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	password: varchar(),
	emailVerified: boolean("email_verified").default(false),
	emailVerificationToken: varchar("email_verification_token", { length: 255 }),
	emailVerificationExpires: timestamp("email_verification_expires", { mode: 'string' }),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	onboardingStep: varchar("onboarding_step", { length: 50 }),
	onboardingData: jsonb("onboarding_data"),
	onboardingStartedAt: timestamp("onboarding_started_at", { mode: 'string' }),
	onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: 'string' }),
	username: varchar({ length: 30 }),
	shortBio: varchar("short_bio", { length: 250 }),
	interestedCategories: integer("interested_categories").array(),
	interestedTags: text("interested_tags").array(),
	followersCount: integer("followers_count").default(0),
	followingCount: integer("following_count").default(0),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const purchases = pgTable("purchases", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: varchar("user_id").notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	fees: numeric({ precision: 10, scale:  2 }).default('0'),
	taxes: numeric({ precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('COP'),
	paymentStatus: varchar("payment_status", { length: 20 }).default('pending'),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentId: varchar("payment_id", { length: 255 }),
	email: varchar().notNull(),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	phone: varchar(),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_purchases_event_id").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("idx_purchases_payment_id").using("btree", table.paymentId.asc().nullsLast().op("text_ops")),
	index("idx_purchases_payment_status").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
	index("idx_purchases_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "purchases_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "purchases_user_id_fkey"
		}).onDelete("cascade"),
	check("purchases_payment_status_check", sql`(payment_status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])`),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }),
	duration: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	images: text().array().default([""]),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "services_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const artworks = pgTable("artworks", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }),
	images: text().array().default([""]),
	price: numeric({ precision: 10, scale:  2 }),
	dimensions: varchar({ length: 100 }),
	materials: text().array().default([""]),
	year: integer(),
	available: boolean().default(true),
	stock: integer().default(1),
	city: varchar({ length: 100 }),
	tags: text().array().default([""]),
	showInExplorer: boolean("show_in_explorer").default(true),
	views: integer().default(0),
	likes: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "artworks_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	organizerId: varchar("organizer_id").notNull(),
	companyId: integer("company_id"),
	venueId: integer("venue_id"),
	title: varchar().notNull(),
	slug: varchar().notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 300 }),
	categoryId: integer("category_id"),
	subcategories: text().array().default([""]),
	tags: text().array().default([""]),
	eventType: varchar("event_type"),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	timezone: varchar().default('America/Bogota'),
	isRecurring: boolean("is_recurring").default(false),
	recurrencePattern: jsonb("recurrence_pattern"),
	locationType: varchar("location_type").default('physical'),
	address: text(),
	city: varchar(),
	state: varchar(),
	country: varchar(),
	coordinates: jsonb(),
	onlineEventUrl: varchar("online_event_url"),
	venueName: varchar("venue_name"),
	venueDescription: text("venue_description"),
	venueCapacity: integer("venue_capacity"),
	isOutdoor: boolean("is_outdoor").default(false),
	isFree: boolean("is_free").default(false),
	ticketPrice: numeric("ticket_price", { precision: 10, scale:  2 }),
	ticketUrl: varchar("ticket_url"),
	capacity: integer(),
	availableTickets: integer("available_tickets"),
	featuredImage: varchar("featured_image"),
	gallery: jsonb().default([]),
	videoUrl: varchar("video_url"),
	status: varchar().default('draft'),
	isFeatured: boolean("is_featured").default(false),
	isVerified: boolean("is_verified").default(false),
	isOnline: boolean("is_online").default(false),
	viewCount: integer("view_count").default(0),
	saveCount: integer("save_count").default(0),
	shareCount: integer("share_count").default(0),
	seoTitle: varchar("seo_title"),
	seoDescription: text("seo_description"),
	seoKeywords: text("seo_keywords"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "events_organizer_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "events_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "events_venue_id_venues_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "events_category_id_categories_id_fk"
		}),
	unique("events_slug_unique").on(table.slug),
]);

export const purchaseItems = pgTable("purchase_items", {
	id: serial().primaryKey().notNull(),
	purchaseId: integer("purchase_id").notNull(),
	ticketTypeId: integer("ticket_type_id").notNull(),
	seatId: integer("seat_id"),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_purchase_items_purchase_id").using("btree", table.purchaseId.asc().nullsLast().op("int4_ops")),
	index("idx_purchase_items_seat_id").using("btree", table.seatId.asc().nullsLast().op("int4_ops")),
	index("idx_purchase_items_ticket_type_id").using("btree", table.ticketTypeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.purchaseId],
			foreignColumns: [purchases.id],
			name: "purchase_items_purchase_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ticketTypeId],
			foreignColumns: [ticketTypes.id],
			name: "purchase_items_ticket_type_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.seatId],
			foreignColumns: [seats.id],
			name: "purchase_items_seat_id_fkey"
		}).onDelete("set null"),
]);

export const eventAttendees = pgTable("event_attendees", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: varchar("user_id").notNull(),
	purchaseId: integer("purchase_id").notNull(),
	ticketTypeId: integer("ticket_type_id").notNull(),
	seatId: integer("seat_id"),
	status: varchar({ length: 20 }).default('registered'),
	customFieldResponses: jsonb("custom_field_responses").default({}),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	checkedInBy: varchar("checked_in_by"),
	registeredAt: timestamp("registered_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_event_attendees_event_id").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("idx_event_attendees_purchase_id").using("btree", table.purchaseId.asc().nullsLast().op("int4_ops")),
	index("idx_event_attendees_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_event_attendees_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_event_user_purchase_unique").using("btree", table.eventId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("text_ops"), table.purchaseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_attendees_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_attendees_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseId],
			foreignColumns: [purchases.id],
			name: "event_attendees_purchase_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ticketTypeId],
			foreignColumns: [ticketTypes.id],
			name: "event_attendees_ticket_type_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.seatId],
			foreignColumns: [seats.id],
			name: "event_attendees_seat_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.checkedInBy],
			foreignColumns: [users.id],
			name: "event_attendees_checked_in_by_fkey"
		}).onDelete("set null"),
	check("event_attendees_status_check", sql`(status)::text = ANY ((ARRAY['registered'::character varying, 'checked_in'::character varying, 'no_show'::character varying, 'cancelled'::character varying])::text[])`),
]);

export const disciplines = pgTable("disciplines", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	categoryId: integer("category_id").notNull(),
	description: text(),
	icon: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "disciplines_category_id_categories_id_fk"
		}).onDelete("cascade"),
	unique("disciplines_code_unique").on(table.code),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	disciplineId: integer("discipline_id").notNull(),
	categoryId: integer("category_id").notNull(),
	description: text(),
	icon: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.disciplineId],
			foreignColumns: [disciplines.id],
			name: "roles_discipline_id_disciplines_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "roles_category_id_categories_id_fk"
		}).onDelete("cascade"),
	unique("roles_code_unique").on(table.code),
]);

export const companies = pgTable("companies", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	description: text(),
	logoUrl: varchar("logo_url"),
	website: varchar(),
	phone: varchar(),
	email: varchar(),
	address: text(),
	city: varchar(),
	state: varchar(),
	country: varchar(),
	postalCode: varchar("postal_code"),
	coordinates: jsonb(),
	socialMedia: jsonb("social_media").default({}),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isPrimary: boolean("is_primary").default(false),
	companyName: varchar("company_name").notNull(),
	legalName: varchar("legal_name"),
	taxId: varchar("tax_id"),
	companyType: varchar("company_type"),
	isActive: boolean("is_active").default(true),
	shortDescription: varchar("short_description", { length: 300 }),
	categories: text().array().default([""]),
	subcategories: text().array().default([""]),
	tags: text().array().default([""]),
	contactPerson: varchar("contact_person"),
	services: jsonb().default([]),
	amenities: jsonb().default([]),
	capacity: integer(),
	rooms: jsonb().default([]),
	openingHours: jsonb("opening_hours").default({}),
	is24H: boolean("is_24h").default(false),
	priceRange: jsonb("price_range"),
	depositRequired: boolean("deposit_required").default(false),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  2 }),
	coverPhotoUrl: varchar("cover_photo_url"),
	gallery: jsonb().default([]),
	videoTourUrl: varchar("video_tour_url"),
	rating: numeric({ precision: 3, scale:  2 }).default('0'),
	totalReviews: integer("total_reviews").default(0),
	viewCount: integer("view_count").default(0),
	saveCount: integer("save_count").default(0),
	isProfileComplete: boolean("is_profile_complete").default(false),
	metadata: jsonb().default({}),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "companies_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userActivities = pgTable("user_activities", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	actorId: varchar("actor_id"),
	type: varchar().notNull(),
	entityType: varchar("entity_type"),
	entityId: varchar("entity_id"),
	metadata: jsonb().default({}),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_activities_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "user_activities_actor_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const artists = pgTable("artists", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	artistName: varchar("artist_name").notNull(),
	stageName: varchar("stage_name"),
	categoryId: integer("category_id"),
	subcategories: text().array().default([""]),
	tags: text().array().default([""]),
	artistType: varchar("artist_type"),
	presentationType: text("presentation_type").array().default([""]),
	serviceTypes: text("service_types").array().default([""]),
	description: text(),
	bio: text(),
	socialMedia: jsonb("social_media").default({}),
	isVerified: boolean("is_verified").default(false),
	isAvailable: boolean("is_available").default(true),
	rating: numeric({ precision: 3, scale:  2 }).default('0'),
	totalReviews: integer("total_reviews").default(0),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	experience: integer(),
	yearsOfExperience: integer("years_of_experience"),
	portfolio: jsonb().default({}),
	videoPresentationUrl: varchar("video_presentation_url"),
	gallery: jsonb().default([]),
	baseCity: varchar("base_city"),
	travelAvailability: boolean("travel_availability").default(false),
	travelDistance: integer("travel_distance"),
	availability: jsonb().default({}),
	pricePerHour: numeric("price_per_hour", { precision: 10, scale:  2 }).default('0'),
	priceRange: jsonb("price_range"),
	services: jsonb().default([]),
	fanCount: integer("fan_count").default(0),
	isProfileComplete: boolean("is_profile_complete").default(false),
	metadata: jsonb().default({}),
	disciplineId: integer("discipline_id"),
	roleId: integer("role_id"),
	specializationId: integer("specialization_id"),
	additionalTalents: integer("additional_talents").array().default([]),
	customStats: jsonb("custom_stats").default({}),
	hourlyRate: numeric("hourly_rate", { precision: 10, scale:  2 }),
	pricingType: varchar("pricing_type").default('depends'),
	education: jsonb().default([]),
	languages: jsonb().default([]),
	licenses: jsonb().default([]),
	linkedAccounts: jsonb("linked_accounts").default({}),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "artists_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "artists_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.disciplineId],
			foreignColumns: [disciplines.id],
			name: "artists_discipline_id_disciplines_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "artists_role_id_roles_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.specializationId],
			foreignColumns: [specializations.id],
			name: "artists_specialization_id_specializations_id_fk"
		}).onDelete("set null"),
	unique("artists_user_id_unique").on(table.userId),
	check("artists_pricing_type_check", sql`(pricing_type)::text = ANY ((ARRAY['hourly'::character varying, 'deliverable'::character varying, 'depends'::character varying])::text[])`),
]);

export const follows = pgTable("follows", {
	id: serial().primaryKey().notNull(),
	followerId: varchar("follower_id").notNull(),
	followingId: varchar("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_follows_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_follows_follower_id").using("btree", table.followerId.asc().nullsLast().op("text_ops")),
	index("idx_follows_following_id").using("btree", table.followingId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "follows_follower_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "follows_following_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	content: text().notNull(),
	authorId: varchar("author_id").notNull(),
	type: postType().default('post').notNull(),
	isPinned: boolean("is_pinned").default(false),
	isPublic: boolean("is_public").default(true),
	likeCount: integer("like_count").default(0),
	commentCount: integer("comment_count").default(0),
	shareCount: integer("share_count").default(0),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	metadata: jsonb().default({}),
}, (table) => [
	index("idx_posts_author_id").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("idx_posts_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_posts_metadata").using("gin", table.metadata.asc().nullsLast().op("jsonb_ops")),
	index("idx_posts_type").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "posts_author_id_fkey"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: varchar().notNull(),
	title: varchar().notNull(),
	message: text().notNull(),
	link: varchar(),
	isRead: boolean("is_read").default(false),
	priority: varchar().default('medium'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	readAt: timestamp("read_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const postMedia = pgTable("post_media", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	url: varchar({ length: 1024 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	thumbnailUrl: varchar("thumbnail_url", { length: 1024 }),
	order: integer().default(0),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_post_media_post_id").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_media_post_id_fkey"
		}).onDelete("cascade"),
]);

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	content: text().notNull(),
	parentId: integer("parent_id"),
	likeCount: integer("like_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_comments_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_comments_parent_id").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("idx_comments_post_id").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	index("idx_comments_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "comments_parent_id_fkey"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	code: varchar({ length: 100 }).notNull(),
}, (table) => [
	unique("categories_code_unique").on(table.code),
]);

export const profileViews = pgTable("profile_views", {
	id: serial().primaryKey().notNull(),
	profileId: varchar("profile_id").notNull(),
	viewerId: varchar("viewer_id"),
	viewerIp: varchar("viewer_ip"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [users.id],
			name: "profile_views_profile_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.viewerId],
			foreignColumns: [users.id],
			name: "profile_views_viewer_id_users_id_fk"
		}).onDelete("set null"),
]);

export const userAchievements = pgTable("user_achievements", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	achievementId: integer("achievement_id").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	notified: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_achievements_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_achievements_id_fk"
		}).onDelete("cascade"),
]);

export const eventOccurrences = pgTable("event_occurrences", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	status: varchar().default('scheduled'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_occurrences_event_id_events_id_fk"
		}).onDelete("cascade"),
]);

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	code: varchar().notNull(),
	name: varchar().notNull(),
	description: text(),
	icon: varchar(),
	category: varchar(),
	points: integer().default(0),
	requirement: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("achievements_code_unique").on(table.code),
]);

export const venues = pgTable("venues", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	address: text(),
	city: varchar(),
	coordinates: jsonb(),
	capacity: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	companyId: integer("company_id").notNull(),
	venueType: varchar("venue_type"),
	services: text().array().default([""]),
	openingHours: jsonb("opening_hours").default({}),
	contact: jsonb().default({}),
	multimedia: jsonb().default({}),
	dailyRate: numeric("daily_rate", { precision: 10, scale:  2 }),
	isAvailable: boolean("is_available").default(true),
	rating: numeric({ precision: 3, scale:  2 }).default('0'),
	totalReviews: integer("total_reviews").default(0),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "venues_company_id_companies_id_fk"
		}).onDelete("cascade"),
]);

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	authorId: varchar("author_id").notNull(),
	title: varchar().notNull(),
	slug: varchar().notNull(),
	excerpt: text(),
	content: text().notNull(),
	featuredImage: varchar("featured_image"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	subtitle: varchar(),
	readingTime: integer("reading_time"),
	category: varchar(),
	subcategories: text().array().default([""]),
	tags: text().array().default([""]),
	gallery: jsonb().default([]),
	videoUrl: varchar("video_url"),
	viewCount: integer("view_count").default(0),
	likeCount: integer("like_count").default(0),
	commentCount: integer("comment_count").default(0),
	shareCount: integer("share_count").default(0),
	saveCount: integer("save_count").default(0),
	visibility: varchar().default('draft'),
	allowComments: boolean("allow_comments").default(true),
	isFeatured: boolean("is_featured").default(false),
	isVerified: boolean("is_verified").default(false),
	seoTitle: varchar("seo_title"),
	seoDescription: text("seo_description"),
	seoKeywords: text("seo_keywords"),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blog_posts_author_id_users_id_fk"
		}).onDelete("cascade"),
	unique("blog_posts_slug_unique").on(table.slug),
]);

export const specializations = pgTable("specializations", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	roleId: integer("role_id").notNull(),
	disciplineId: integer("discipline_id").notNull(),
	categoryId: integer("category_id").notNull(),
	description: text(),
	isCustom: boolean("is_custom").default(false),
	isApproved: boolean("is_approved").default(false),
	proposedBy: varchar("proposed_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "specializations_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.disciplineId],
			foreignColumns: [disciplines.id],
			name: "specializations_discipline_id_disciplines_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "specializations_category_id_categories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposedBy],
			foreignColumns: [users.id],
			name: "specializations_proposed_by_users_id_fk"
		}).onDelete("set null"),
	unique("specializations_code_unique").on(table.code),
]);

export const userDocuments = pgTable("user_documents", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	rejectionReason: text("rejection_reason"),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_documents_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "user_documents_reviewed_by_users_id_fk"
		}).onDelete("set null"),
]);

export const carts = pgTable("carts", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	sessionId: varchar("session_id", { length: 255 }),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).default(sql`(now() + '7 days'::interval)`),
}, (table) => [
	index("idx_cart_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_cart_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_cart_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_cart_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_fkey"
		}).onDelete("cascade"),
	unique("carts_user_id_status_key").on(table.userId, table.status),
	check("carts_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'checked_out'::character varying, 'abandoned'::character varying, 'expired'::character varying])::text[])`),
]);

export const gallery = pgTable("gallery", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	title: varchar(),
	description: text(),
	imageUrl: varchar("image_url").notNull(),
	tags: text().array().default([""]),
	isPublic: boolean("is_public").default(true),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isFeatured: boolean("is_featured").default(false),
	orderPosition: integer("order_position").default(0),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "gallery_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const blogComments = pgTable("blog_comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	authorId: varchar("author_id").notNull(),
	parentId: integer("parent_id"),
	content: text().notNull(),
	isApproved: boolean("is_approved").default(true),
	likeCount: integer("like_count").default(0),
	replyCount: integer("reply_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "blog_comments_post_id_blog_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blog_comments_author_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "blog_comments_parent_id_blog_comments_id_fk"
		}).onDelete("cascade"),
]);

export const highlightPhotos = pgTable("highlight_photos", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	imageUrl: varchar("image_url").notNull(),
	position: integer().notNull(),
	caption: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("user_position_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "highlight_photos_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const blogPostLikes = pgTable("blog_post_likes", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	userId: varchar("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("post_user_idx").using("btree", table.postId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "blog_post_likes_post_id_blog_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "blog_post_likes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const customSpecializationProposals = pgTable("custom_specialization_proposals", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	roleId: integer("role_id").notNull(),
	proposedName: varchar("proposed_name", { length: 255 }).notNull(),
	proposedCode: varchar("proposed_code", { length: 100 }).notNull(),
	description: text(),
	justification: text(),
	status: varchar({ length: 50 }).default('pending'),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "custom_specialization_proposals_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "custom_specialization_proposals_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "custom_specialization_proposals_reviewed_by_users_id_fk"
		}).onDelete("set null"),
]);

export const featuredItems = pgTable("featured_items", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	url: text().notNull(),
	type: varchar().notNull(),
	thumbnailUrl: text("thumbnail_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "featured_items_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const offers = pgTable("offers", {
	id: serial().primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	artistId: integer("artist_id"),
	category: varchar().notNull(),
	description: text().notNull(),
	budgetMin: numeric("budget_min", { precision: 12, scale:  2 }),
	budgetMax: numeric("budget_max", { precision: 12, scale:  2 }),
	modality: varchar().default('presencial'),
	eventDate: timestamp("event_date", { mode: 'string' }),
	eventTime: varchar("event_time"),
	location: text(),
	status: varchar().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [users.id],
			name: "offers_client_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [artists.id],
			name: "offers_artist_id_artists_id_fk"
		}).onDelete("cascade"),
]);

export const profileAnalytics = pgTable("profile_analytics", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	date: date().notNull(),
	profileViews: integer("profile_views").default(0),
	uniqueVisitors: integer("unique_visitors").default(0),
	clicksOnContact: integer("clicks_on_contact").default(0),
	clicksOnSocial: integer("clicks_on_social").default(0),
	favoriteAdds: integer("favorite_adds").default(0),
	shareCount: integer("share_count").default(0),
	averageTimeOnProfile: integer("average_time_on_profile").default(0),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "profile_analytics_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const roleStats = pgTable("role_stats", {
	id: serial().primaryKey().notNull(),
	roleId: integer("role_id").notNull(),
	statKey: varchar("stat_key", { length: 100 }).notNull(),
	statLabel: varchar("stat_label", { length: 255 }).notNull(),
	statType: varchar("stat_type", { length: 50 }).notNull(),
	statOptions: jsonb("stat_options"),
	isRequired: boolean("is_required").default(false),
	placeholder: varchar({ length: 255 }),
	helpText: text("help_text"),
	validationRules: jsonb("validation_rules"),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_stats_role_id_roles_id_fk"
		}).onDelete("cascade"),
]);

export const savedItems = pgTable("saved_items", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	postId: integer("post_id"),
	savedAt: timestamp("saved_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	notes: text(),
}, (table) => [
	uniqueIndex("user_post_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.postId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "saved_items_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "saved_items_post_id_blog_posts_id_fk"
		}).onDelete("cascade"),
]);

export const tads = pgTable("tads", {
	id: serial().primaryKey().notNull(),
	roleId: integer("role_id").notNull(),
	suggestedDisciplineId: integer("suggested_discipline_id").notNull(),
	priority: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "tads_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.suggestedDisciplineId],
			foreignColumns: [disciplines.id],
			name: "tads_suggested_discipline_id_disciplines_id_fk"
		}).onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	favoriteCategories: text("favorite_categories").array().default([""]),
	interests: text().array().default([""]),
	priceRange: jsonb("price_range"),
	preferredLocations: text("preferred_locations").array().default([""]),
	notificationPreferences: jsonb("notification_preferences").default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_preferences_user_id_unique").on(table.userId),
]);

export const customTadProposals = pgTable("custom_tad_proposals", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	roleId: integer("role_id").notNull(),
	proposedDisciplineName: varchar("proposed_discipline_name", { length: 255 }).notNull(),
	justification: text(),
	status: varchar({ length: 50 }).default('pending'),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "custom_tad_proposals_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "custom_tad_proposals_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "custom_tad_proposals_reviewed_by_users_id_fk"
		}).onDelete("set null"),
]);

export const userContracts = pgTable("user_contracts", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	artistId: varchar("artist_id").notNull(),
	serviceId: integer("service_id"),
	serviceType: varchar("service_type").notNull(),
	serviceName: varchar("service_name").notNull(),
	description: text(),
	amount: numeric({ precision: 10, scale:  2 }),
	status: varchar().default('pending'),
	contractDate: timestamp("contract_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	serviceDate: timestamp("service_date", { mode: 'string' }),
	completionDate: timestamp("completion_date", { mode: 'string' }),
	rating: integer(),
	review: text(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [users.id],
			name: "user_contracts_artist_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_contracts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const cartItems = pgTable("cart_items", {
	id: serial().primaryKey().notNull(),
	cartId: integer("cart_id").notNull(),
	itemType: varchar("item_type", { length: 50 }).notNull(),
	itemId: integer("item_id").notNull(),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_cart_items_cart").using("btree", table.cartId.asc().nullsLast().op("int4_ops")),
	index("idx_cart_items_item").using("btree", table.itemType.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("int4_ops")),
	index("idx_cart_items_type").using("btree", table.itemType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_fkey"
		}).onDelete("cascade"),
	unique("cart_items_cart_id_item_type_item_id_metadata_key").on(table.cartId, table.itemType, table.itemId, table.metadata),
	check("cart_items_item_type_check", sql`(item_type)::text = ANY ((ARRAY['service'::character varying, 'product'::character varying, 'event'::character varying, 'booking'::character varying])::text[])`),
	check("cart_items_quantity_check", sql`quantity > 0`),
	check("cart_items_price_check", sql`price >= (0)::numeric`),
]);

export const userQuotations = pgTable("user_quotations", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	artistId: varchar("artist_id").notNull(),
	serviceType: varchar("service_type").notNull(),
	title: varchar().notNull(),
	description: text().notNull(),
	budgetMin: numeric("budget_min", { precision: 10, scale:  2 }),
	budgetMax: numeric("budget_max", { precision: 10, scale:  2 }),
	preferredDate: timestamp("preferred_date", { mode: 'string' }),
	location: varchar(),
	status: varchar().default('pending'),
	quotedAmount: numeric("quoted_amount", { precision: 10, scale:  2 }),
	artistResponse: text("artist_response"),
	responseDate: timestamp("response_date", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_quotations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artistId],
			foreignColumns: [users.id],
			name: "user_quotations_artist_id_users_id_fk"
		}),
]);

export const cartCheckouts = pgTable("cart_checkouts", {
	id: serial().primaryKey().notNull(),
	cartId: integer("cart_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	itemsCount: integer("items_count").notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending'),
	paymentId: varchar("payment_id", { length: 255 }),
	checkoutData: jsonb("checkout_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("idx_cart_checkouts_payment").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
	index("idx_cart_checkouts_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_checkouts_cart_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_checkouts_user_id_fkey"
		}).onDelete("cascade"),
	check("cart_checkouts_payment_status_check", sql`(payment_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])`),
]);

export const hashtags = pgTable("hashtags", {
	id: serial().primaryKey().notNull(),
	tag: varchar({ length: 100 }).notNull(),
	useCount: integer("use_count").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_hashtags_tag").using("btree", table.tag.asc().nullsLast().op("text_ops")),
	index("idx_hashtags_use_count").using("btree", table.useCount.desc().nullsFirst().op("int4_ops")),
	unique("hashtags_tag_key").on(table.tag),
]);

export const postLikes = pgTable("post_likes", {
	postId: integer("post_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_post_likes_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_post_likes_post_id").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	index("idx_post_likes_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_likes_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_likes_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.postId, table.userId], name: "post_likes_pkey"}),
]);

export const commentLikes = pgTable("comment_likes", {
	commentId: integer("comment_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_comment_likes_comment_id").using("btree", table.commentId.asc().nullsLast().op("int4_ops")),
	index("idx_comment_likes_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_likes_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comment_likes_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.commentId, table.userId], name: "comment_likes_pkey"}),
]);

export const postHashtags = pgTable("post_hashtags", {
	postId: integer("post_id").notNull(),
	hashtagId: integer("hashtag_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_post_hashtags_hashtag_id").using("btree", table.hashtagId.asc().nullsLast().op("int4_ops")),
	index("idx_post_hashtags_post_id").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_hashtags_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.hashtagId],
			foreignColumns: [hashtags.id],
			name: "post_hashtags_hashtag_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.postId, table.hashtagId], name: "post_hashtags_pkey"}),
]);
