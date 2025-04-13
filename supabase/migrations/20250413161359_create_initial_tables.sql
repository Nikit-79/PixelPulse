CREATE TABLE research_papers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    image_url text, 
    uploaded_at timestamp with time zone DEFAULT now()
);

CREATE TABLE newsletters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    image_url text, 
    uploaded_at timestamp with time zone DEFAULT now()
);

CREATE TABLE team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    image_url text,
    added_at timestamp with time zone DEFAULT now()
);
