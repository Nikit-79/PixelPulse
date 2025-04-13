-- Add position column to team_members table
ALTER TABLE team_members
ADD COLUMN position integer;

-- Set initial positions for existing team members
WITH indexed_team_members AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY added_at ASC) as row_num
  FROM team_members
)
UPDATE team_members
SET position = indexed_team_members.row_num
FROM indexed_team_members
WHERE team_members.id = indexed_team_members.id;

-- Create a trigger function to auto-assign position for new team members
CREATE OR REPLACE FUNCTION team_members_assign_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position FROM team_members;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign position automatically for new records
CREATE TRIGGER team_members_position_trigger
BEFORE INSERT ON team_members
FOR EACH ROW
EXECUTE FUNCTION team_members_assign_position();
