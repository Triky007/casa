-- Añadir columna periodicity a la tabla task
ALTER TABLE task ADD COLUMN periodicity VARCHAR(10) DEFAULT 'daily' NOT NULL;

-- Comentario: Esta columna almacenará los valores 'daily', 'weekly' o 'special'
-- Corresponde al enum TaskPeriodicity en el modelo Task
