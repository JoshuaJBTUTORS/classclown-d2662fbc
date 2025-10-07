-- Make video_number auto-generate based on position in month/subject
ALTER TABLE content_calendar 
ALTER COLUMN video_number DROP NOT NULL;

-- Add a function to auto-assign video numbers
CREATE OR REPLACE FUNCTION assign_video_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.video_number IS NULL THEN
    NEW.video_number := COALESCE(
      (SELECT MAX(video_number) + 1 
       FROM content_calendar 
       WHERE month = NEW.month 
       AND subject = NEW.subject),
      1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign video numbers
DROP TRIGGER IF EXISTS auto_assign_video_number ON content_calendar;
CREATE TRIGGER auto_assign_video_number
  BEFORE INSERT ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION assign_video_number();