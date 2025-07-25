// Manual cache clearing script for Ben's user ID
// Run this in the browser console on Ben's course page

(() => {
  const benUserId = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';
  const courseId = '31084174-d6ff-4a3e-b670-cca6256a7f31'; // Biology course
  
  console.log('🧹 Clearing cache for Ben...');
  
  // Clear specific personalized learning path cache
  const specificCacheKey = `personalized_path_${benUserId}_${courseId}`;
  if (localStorage.getItem(specificCacheKey)) {
    localStorage.removeItem(specificCacheKey);
    console.log(`✅ Cleared: ${specificCacheKey}`);
  }
  
  // Clear all localStorage items related to Ben's user ID
  const keys = Object.keys(localStorage);
  const benKeys = keys.filter(key => 
    key.includes(benUserId) || 
    key.startsWith('personalized_path_') ||
    key.includes(courseId)
  );
  
  benKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Cleared: ${key}`);
  });
  
  console.log(`🎉 Cache clearing complete! Cleared ${benKeys.length + 1} items.`);
  console.log('🔄 Reloading page to apply changes...');
  
  // Reload the page after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 1000);
})();