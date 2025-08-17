CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_name" varchar NOT NULL,
	"stage_name" varchar,
	"category_id" integer,
	"subcategories" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"artist_type" varchar,
	"presentation_type" text[] DEFAULT '{}',
	"service_types" text[] DEFAULT '{}',
	"experience" integer,
	"years_of_experience" integer,
	"description" text,
	"bio" text,
	"social_media" jsonb DEFAULT '{}'::jsonb,
	"portfolio" jsonb DEFAULT '{}'::jsonb,
	"video_presentation_url" varchar,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"base_city" varchar,
	"travel_availability" boolean DEFAULT false,
	"travel_distance" integer,
	"availability" jsonb DEFAULT '{}'::jsonb,
	"price_per_hour" numeric(10, 2) DEFAULT 0,
	"price_range" jsonb,
	"services" jsonb DEFAULT '[]'::jsonb,
	"rating" numeric(3, 2) DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"fan_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"is_available" boolean DEFAULT true,
	"is_profile_complete" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "artists_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "blog_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"is_approved" boolean DEFAULT true,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "blog_post_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"subtitle" varchar,
	"content" text NOT NULL,
	"excerpt" text,
	"reading_time" integer,
	"category" varchar,
	"subcategories" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"featured_image" varchar,
	"gallery" jsonb DEFAULT '[]',
	"video_url" varchar,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"save_count" integer DEFAULT 0,
	"visibility" varchar DEFAULT 'draft',
	"allow_comments" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"seo_title" varchar,
	"seo_description" text,
	"seo_keywords" text,
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"legal_name" varchar,
	"tax_id" varchar,
	"description" text,
	"short_description" varchar(300),
	"company_type" varchar,
	"categories" text[] DEFAULT '{}',
	"subcategories" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"contact_person" varchar,
	"phone" varchar,
	"email" varchar,
	"website" varchar,
	"social_media" jsonb DEFAULT '{}',
	"address" text,
	"city" varchar,
	"state" varchar,
	"country" varchar,
	"postal_code" varchar,
	"coordinates" jsonb,
	"services" jsonb DEFAULT '[]',
	"amenities" jsonb DEFAULT '[]',
	"capacity" integer,
	"rooms" jsonb DEFAULT '[]',
	"opening_hours" jsonb DEFAULT '{}',
	"is_24h" boolean DEFAULT false,
	"price_range" jsonb,
	"deposit_required" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2),
	"logo_url" varchar,
	"cover_photo_url" varchar,
	"gallery" jsonb DEFAULT '[]',
	"video_tour_url" varchar,
	"rating" numeric(3, 2) DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"save_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"is_profile_complete" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "companies_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "event_occurrences" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" varchar DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizer_id" varchar NOT NULL,
	"company_id" integer,
	"venue_id" integer,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"short_description" varchar(300),
	"category_id" integer,
	"subcategories" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"event_type" varchar,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"timezone" varchar DEFAULT 'America/Bogota',
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"location_type" varchar DEFAULT 'physical',
	"address" text,
	"city" varchar,
	"state" varchar,
	"country" varchar,
	"coordinates" jsonb,
	"online_event_url" varchar,
	"venue_name" varchar,
	"venue_description" text,
	"venue_capacity" integer,
	"is_outdoor" boolean DEFAULT false,
	"is_free" boolean DEFAULT false,
	"ticket_price" numeric(10, 2),
	"ticket_url" varchar,
	"capacity" integer,
	"available_tickets" integer,
	"featured_image" varchar,
	"gallery" jsonb DEFAULT '[]',
	"video_url" varchar,
	"status" varchar DEFAULT 'draft',
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"is_online" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"save_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"seo_title" varchar,
	"seo_description" text,
	"seo_keywords" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_id" integer,
	"event_id" integer,
	"venue_id" integer,
	"gallery_id" integer,
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "featured_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"type" varchar NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar,
	"description" text,
	"image_url" varchar NOT NULL,
	"tags" text[] DEFAULT '{}'::text[],
	"is_public" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "hiring_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar NOT NULL,
	"artist_id" integer,
	"venue_id" integer,
	"details" text NOT NULL,
	"event_date" date NOT NULL,
	"status" varchar DEFAULT 'open',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "hiring_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"proposal" text NOT NULL,
	"message" text,
	"status" varchar DEFAULT 'open',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar NOT NULL,
	"artist_id" integer,
	"category" varchar NOT NULL,
	"description" text NOT NULL,
	"budget_min" numeric(12, 2),
	"budget_max" numeric(12, 2),
	"modality" varchar DEFAULT 'presencial',
	"event_date" timestamp,
	"event_time" varchar,
	"location" text,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id" integer,
	"artist_id" integer,
	"event_id" integer,
	"venue_id" integer,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"type" varchar NOT NULL,
	"score" numeric(3, 2) DEFAULT 0,
	"is_approved" boolean DEFAULT true,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_id" integer,
	"event_id" integer,
	"venue_id" integer,
	"type" varchar NOT NULL,
	"score" numeric NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "saved_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id" integer,
	"saved_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar,
	"display_name" varchar,
	"profile_image_url" varchar,
	"cover_image_url" varchar,
	"user_type" varchar DEFAULT 'general' NOT NULL,
	"bio" text,
	"city" varchar,
	"address" text,
	"phone" varchar,
	"website" varchar,
	"social_media" jsonb,
	"is_verified" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"is_available" boolean DEFAULT true,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"total_reviews" integer DEFAULT 0,
	"fan_count" integer DEFAULT 0,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"last_active" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"venue_type" varchar,
	"services" text[] DEFAULT '{}',
	"address" text,
	"city" varchar,
	"opening_hours" jsonb DEFAULT '{}',
	"contact" jsonb DEFAULT '{}',
	"multimedia" jsonb DEFAULT '{}',
	"coordinates" jsonb,
	"daily_rate" numeric(10, 2),
	"capacity" integer,
	"is_available" boolean DEFAULT true,
	"rating" numeric(3, 2) DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parent_id_blog_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_likes" ADD CONSTRAINT "blog_post_likes_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_likes" ADD CONSTRAINT "blog_post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_items" ADD CONSTRAINT "featured_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_responses" ADD CONSTRAINT "hiring_responses_request_id_hiring_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."hiring_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_responses" ADD CONSTRAINT "hiring_responses_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_user_idx" ON "blog_post_likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_post_idx" ON "saved_items" USING btree ("user_id","post_id");