DO Yellow
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tc.table_name, kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'profiles'
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        EXECUTE 'ALTER TABLE ' || r.table_name || ' ADD CONSTRAINT ' || r.constraint_name || ' FOREIGN KEY (' || r.column_name || ') REFERENCES profiles(id) ON DELETE CASCADE';
    END LOOP;
END Yellow;