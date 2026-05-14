
-- Recalibrate category positioning to a center-based system (0 = Center)
ALTER TABLE categories 
ALTER COLUMN image_offset_y SET DEFAULT 0;

COMMENT ON COLUMN categories.image_offset_y IS 'Vertical offset from center (0 is center, negative is up, positive is down)';
