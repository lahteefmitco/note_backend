const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://axnturdhhmqwgyaldekj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bnR1cmRoaG1xd2d5YWxkZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NzQ1ODksImV4cCI6MjA0OTE1MDU4OX0.o-gViJ9fYoVCryefCHM72C-sV74t7LsxDK9f6AtmpEM'; // Use a service key for secure operations
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;