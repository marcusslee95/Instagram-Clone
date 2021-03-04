CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "updated_at" timestamp,
  "username" varchar(50),
  "bio" varchar(400),
  "avatar" varchar(200),
  "phone" varchar(25),
  "email" varchar(40),
  "password" varchar(50),
  "status" varchar(15)
);

CREATE TABLE "posts" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "updated_at" timestamp,
  "url" varchar(200),
  "user_id" integer,
  "caption" varchar(240),
  "lat" real,
  "long" real
);

CREATE TABLE "comments" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "updated_at" timestamp,
  "content" varchar(300),
  "user_id" integer,
  "post_id" integer
);

CREATE TABLE "likes" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "user_id" integer,
  "post_id" integer,
  "comment_id" integer
);

CREATE TABLE "photo_tags" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "updated_at" timestamp,
  "user_id" integer,
  "post_id" integer,
  "x" integer,
  "y" integer
);

CREATE TABLE "caption_tags" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "user_id" integer,
  "post_id" integer
);

CREATE TABLE "hashtags" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "title" varchar(20)
);

CREATE TABLE "hashtags_posts" (
  "id" SERIAL PRIMARY KEY,
  "post_id" integer,
  "hashtag_id" integer
);

CREATE TABLE "followers" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "user_id" integer,
  "follower_id" integer
);

ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id");

ALTER TABLE "photo_tags" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "photo_tags" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "caption_tags" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "caption_tags" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "hashtags_posts" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "hashtags_posts" ADD FOREIGN KEY ("hashtag_id") REFERENCES "hashtags" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "followers" ADD FOREIGN KEY ("follower_id") REFERENCES "users" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("id") REFERENCES "comments" ("content");
