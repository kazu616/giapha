ALTER TABLE users ADD COLUMN person_id TEXT REFERENCES people (id);

CREATE UNIQUE INDEX users_person_id_unique ON users (person_id) WHERE person_id IS NOT NULL;
