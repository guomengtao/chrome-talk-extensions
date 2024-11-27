const { createClient } = window.supabase;

const supabaseUrl = 'https://tkcrnfgnspvtzwbbvyfv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEwMDg4NzcsImV4cCI6MjAxNjU4NDg3N30.BbzNnz5iF7oFAXbKJYzLxwBLvLXyXgGHVP1UkTZqnKo';

export const supabase = createClient(supabaseUrl, supabaseKey); 