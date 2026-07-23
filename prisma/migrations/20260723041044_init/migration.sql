-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('BACKLOG', 'PLAYING', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "platform" VARCHAR(30) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'BACKLOG',
    "rating" SMALLINT,
    "cover_url" VARCHAR(255),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "play_sessions" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "hours" DECIMAL(4,1) NOT NULL,
    "session_date" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "play_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" SERIAL NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "price_limit" DECIMAL(6,2),
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
