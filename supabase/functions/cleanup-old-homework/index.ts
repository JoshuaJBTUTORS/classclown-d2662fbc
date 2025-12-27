import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const buckets = ['homework', 'homework-submissions'];
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    console.log(`Starting cleanup for files older than ${twoMonthsAgo.toISOString()}`);

    const results: { bucket: string; deletedCount: number; errors: string[] }[] = [];

    for (const bucket of buckets) {
      console.log(`Processing bucket: ${bucket}`);
      
      // Query old files from storage.objects
      const { data: oldFiles, error: queryError } = await supabase
        .from('storage.objects')
        .select('name')
        .eq('bucket_id', bucket)
        .lt('created_at', twoMonthsAgo.toISOString());

      if (queryError) {
        // Fallback: use raw SQL query
        const { data: sqlFiles, error: sqlError } = await supabase.rpc('get_old_storage_files', {
          bucket_name: bucket,
          older_than: twoMonthsAgo.toISOString()
        }).catch(() => ({ data: null, error: null }));

        if (sqlError || !sqlFiles) {
          console.log(`Using storage.list for bucket: ${bucket}`);
          
          // Use storage API to list and filter
          const { data: allFiles, error: listError } = await supabase.storage
            .from(bucket)
            .list('', { limit: 1000 });

          if (listError) {
            console.error(`Error listing files from ${bucket}:`, listError);
            results.push({ bucket, deletedCount: 0, errors: [listError.message] });
            continue;
          }

          const filesToDelete = (allFiles || [])
            .filter(file => {
              const fileDate = new Date(file.created_at);
              return fileDate < twoMonthsAgo;
            })
            .map(file => file.name);

          if (filesToDelete.length === 0) {
            console.log(`No old files found in ${bucket}`);
            results.push({ bucket, deletedCount: 0, errors: [] });
            continue;
          }

          console.log(`Found ${filesToDelete.length} old files in ${bucket}`);

          // Delete in batches of 100
          const errors: string[] = [];
          let deletedCount = 0;
          const batchSize = 100;

          for (let i = 0; i < filesToDelete.length; i += batchSize) {
            const batch = filesToDelete.slice(i, i + batchSize);
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove(batch);

            if (deleteError) {
              console.error(`Error deleting batch from ${bucket}:`, deleteError);
              errors.push(deleteError.message);
            } else {
              deletedCount += batch.length;
              console.log(`Deleted batch of ${batch.length} files from ${bucket}`);
            }
          }

          results.push({ bucket, deletedCount, errors });
          continue;
        }
      }

      // If we got files from the query
      const files = oldFiles || [];
      if (files.length === 0) {
        console.log(`No old files found in ${bucket}`);
        results.push({ bucket, deletedCount: 0, errors: [] });
        continue;
      }

      const filesToDelete = files.map((f: { name: string }) => f.name);
      console.log(`Found ${filesToDelete.length} old files in ${bucket}`);

      // Delete in batches
      const errors: string[] = [];
      let deletedCount = 0;
      const batchSize = 100;

      for (let i = 0; i < filesToDelete.length; i += batchSize) {
        const batch = filesToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(batch);

        if (deleteError) {
          console.error(`Error deleting batch from ${bucket}:`, deleteError);
          errors.push(deleteError.message);
        } else {
          deletedCount += batch.length;
          console.log(`Deleted batch of ${batch.length} files from ${bucket}`);
        }
      }

      results.push({ bucket, deletedCount, errors });
    }

    const summary = {
      success: true,
      cleanupDate: new Date().toISOString(),
      cutoffDate: twoMonthsAgo.toISOString(),
      results,
      totalDeleted: results.reduce((sum, r) => sum + r.deletedCount, 0),
    };

    console.log('Cleanup complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
