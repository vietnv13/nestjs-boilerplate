CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"original_filename" text,
	"content_type" text,
	"size" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"creator_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "assets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "asset_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"slot" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_links" ADD CONSTRAINT "asset_links_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "assets_creator_id_idx" ON "assets" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "assets_created_at_idx" ON "assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assets_deleted_at_idx" ON "assets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "asset_links_asset_id_idx" ON "asset_links" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_links_owner_idx" ON "asset_links" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "asset_links_slot_idx" ON "asset_links" USING btree ("slot");--> statement-breakpoint
CREATE INDEX "asset_links_deleted_at_idx" ON "asset_links" USING btree ("deleted_at");
