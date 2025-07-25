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
ALTER TABLE "artists" ALTER COLUMN "experience" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "social_media" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar;--> statement-breakpoint
ALTER TABLE "featured_items" ADD CONSTRAINT "featured_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;