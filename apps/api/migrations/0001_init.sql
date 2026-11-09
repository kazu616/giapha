-- Schema ban đầu. Thay đổi sau này thêm cột nullable trước, rồi mới siết NOT NULL.
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'editor', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL
);

CREATE TABLE people (
    id TEXT PRIMARY KEY,
    clan_id TEXT NOT NULL REFERENCES clans (id),
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    father_id TEXT,
    mother_id TEXT,
    spouse_id TEXT,
    birth_order INT,
    generation INT,
    note TEXT
);

CREATE INDEX idx_people_clan_id ON people (clan_id);
CREATE INDEX idx_people_father_id ON people (father_id);
CREATE INDEX idx_people_mother_id ON people (mother_id);

CREATE TABLE news (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users (id),
    published_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_news_published_at ON news (published_at DESC);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    event_date DATE NOT NULL,
    place TEXT NOT NULL,
    body TEXT NOT NULL
);

CREATE INDEX idx_events_event_date ON events (event_date);
