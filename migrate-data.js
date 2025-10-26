import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Old database
const oldSupabase = createClient(
  'https://jzgnqehmofzkxyozulcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z25xZWhtb2Z6a3h5b3p1bGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDYxOTEsImV4cCI6MjA3NjcyMjE5MX0.53dT-Gs9KF4uKCX8DD3ali6jVySoET_rpejcb3suvhU'
);

// New database
const newSupabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function migrateData() {
  console.log('🚀 Starting data migration...\n');

  try {
    // Migrate clients
    console.log('📋 Migrating clients...');
    const { data: clients, error: clientsError } = await oldSupabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('Error fetching clients:', JSON.stringify(clientsError, null, 2));
    } else {
      console.log(`Found ${clients?.length || 0} clients in old database`);
    }

    if (clients && clients.length > 0) {
      const { error: insertError } = await newSupabase
        .from('clients')
        .insert(clients);

      if (insertError) {
        console.error('Error inserting clients:', insertError);
      } else {
        console.log(`✅ Migrated ${clients.length} clients`);
      }
    } else {
      console.log('ℹ️  No clients to migrate');
    }

    // Migrate recommendations
    console.log('\n📋 Migrating recommendations...');
    const { data: recommendations, error: recError } = await oldSupabase
      .from('recommendations')
      .select('*');

    if (recError) {
      console.error('Error fetching recommendations:', JSON.stringify(recError, null, 2));
    } else {
      console.log(`Found ${recommendations?.length || 0} recommendations in old database`);
    }

    if (recommendations && recommendations.length > 0) {
      const { error: insertError } = await newSupabase
        .from('recommendations')
        .insert(recommendations);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
      } else {
        console.log(`✅ Migrated ${recommendations.length} recommendations`);
      }
    } else {
      console.log('ℹ️  No recommendations to migrate');
    }

    // Migrate team_members
    console.log('\n📋 Migrating team members...');
    const { data: teamMembers, error: teamError } = await oldSupabase
      .from('team_members')
      .select('*');

    if (teamError) {
      console.error('Error fetching team members:', JSON.stringify(teamError, null, 2));
    } else {
      console.log(`Found ${teamMembers?.length || 0} team members in old database`);
    }

    if (teamMembers && teamMembers.length > 0) {
      const { error: insertError } = await newSupabase
        .from('team_members')
        .insert(teamMembers);

      if (insertError) {
        console.error('Error inserting team members:', insertError);
      } else {
        console.log(`✅ Migrated ${teamMembers.length} team members`);
      }
    } else {
      console.log('ℹ️  No team members to migrate');
    }

    console.log('\n✨ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();
