
-- Add fine-tuned positioning and layout columns to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_tilt float DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_offset_y float DEFAULT -55,
ADD COLUMN IF NOT EXISTS image_scale float DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS image_side text DEFAULT 'left';

COMMENT ON COLUMN categories.image_tilt IS 'Rotation angle for the pop-out product';
COMMENT ON COLUMN categories.image_offset_y IS 'Vertical translation percentage';
COMMENT ON COLUMN categories.image_scale IS 'Scaling factor for the image';
COMMENT ON COLUMN categories.image_side IS 'Horizontal placement (left or right)';
