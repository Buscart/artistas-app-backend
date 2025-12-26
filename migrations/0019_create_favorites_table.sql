-- Migration para crear la tabla de favoritos

CREATE TABLE "favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "entity_id" integer NOT NULL,
  "entity_type" varchar NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "favorites_user_id_index" ON "favorites" ("user_id");
CREATE INDEX "favorites_entity_index" ON "favorites" ("entity_id", "entity_type");
ALTER TABLE "favorites" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE cascade;

COMMENT ON TABLE "favorites" IS 'Tabla para almacenar los elementos favoritos de los usuarios (artistas, eventos, etc.)';
COMMENT ON COLUMN "favorites"."entity_type" IS 'El tipo de entidad a la que se le da favorito (artist, event, venue, gallery)';
