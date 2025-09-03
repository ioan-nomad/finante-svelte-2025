-- CODEX N-OMAD Database Schema
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('breakfast','lunch','dinner','snack')),
    mtor_phase TEXT CHECK(mtor_phase IN ('high','low')),
    prep_time INTEGER,
    cook_time INTEGER,
    instant_pot BOOLEAN DEFAULT 0,
    anti_inflammatory BOOLEAN DEFAULT 0,
    plant_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    plant_species TEXT,
    anti_inflammatory_score INTEGER CHECK(anti_inflammatory_score BETWEEN 0 AND 10),
    allergen BOOLEAN DEFAULT 0,
    unit TEXT DEFAULT 'g',
    nico_safe BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id INTEGER,
    ingredient_id INTEGER,
    quantity REAL,
    unit TEXT,
    layer INTEGER,
    optional BOOLEAN DEFAULT 0,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id),
    FOREIGN KEY(ingredient_id) REFERENCES ingredients(id),
    PRIMARY KEY(recipe_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS nutrition_values (
    ingredient_id INTEGER PRIMARY KEY,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    fiber REAL,
    omega3 REAL,
    FOREIGN KEY(ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS mtor_schedule (
    day INTEGER PRIMARY KEY CHECK(day BETWEEN 1 AND 14),
    phase TEXT CHECK(phase IN ('high','low')),
    protein_target REAL,
    plant_target INTEGER
);

-- Indexes pentru performance
CREATE INDEX idx_recipes_mtor ON recipes(mtor_phase);
CREATE INDEX idx_ingredients_anti ON ingredients(anti_inflammatory_score);
CREATE INDEX idx_recipes_plants ON recipes(plant_count);