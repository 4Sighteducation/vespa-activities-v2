// Test script for VESPA Activities Media Loading Optimization
// Run this in the browser console after loading an activity

(function testMediaLoading() {
    console.log('🔍 Testing VESPA Activities Media Loading...\n');
    
    // Check if activities data is loaded
    if (!window.vespaActivitiesData) {
        console.error('❌ Activities data not loaded! Make sure loadActivitiesJson() has run.');
        return;
    }
    
    // Get sample activity data
    const sampleActivityId = Object.keys(window.vespaActivitiesData)[0];
    const sampleData = window.vespaActivitiesData[sampleActivityId];
    
    console.log('✅ Activities data loaded successfully');
    console.log(`📊 Total activities: ${Object.keys(window.vespaActivitiesData).length}`);
    console.log('\n📌 Sample activity data:');
    console.log(`Activity ID: ${sampleActivityId}`);
    console.log(`Video URL: ${sampleData.videoUrl || 'No video'}`);
    console.log(`Slides URL: ${sampleData.slidesUrl || 'No slides'}`);
    
    // Check for URL parameters
    if (sampleData.slidesUrl && sampleData.slidesUrl.includes('?')) {
        console.warn('⚠️ Slides URL contains parameters! This may cause delays.');
    } else if (sampleData.slidesUrl) {
        console.log('✅ Slides URL is clean (no parameters)');
    }
    
    // Check current activity renderer
    if (window.vespaActivityRenderer) {
        console.log('\n🎯 Current Activity Renderer:');
        console.log(`Activity ID: ${window.vespaActivityRenderer.activity?.activityId}`);
        console.log(`Media iframes:`, window.vespaActivityRenderer._mediaIframes);
        
        // Check preconnect links
        const preconnects = document.querySelectorAll('link[rel="preconnect"]');
        console.log(`\n🔗 Preconnect links: ${preconnects.length}`);
        preconnects.forEach(link => console.log(`  - ${link.href}`));
    }
    
    // Performance timing function
    window.measureIframeLoad = function(type) {
        const startTime = performance.now();
        const originalLoadIframe = window.vespaActivityRenderer.loadIframe;
        
        window.vespaActivityRenderer.loadIframe = function(iframeType, src) {
            if (iframeType === type) {
                originalLoadIframe.call(this, iframeType, src);
                
                // Monitor iframe load
                setTimeout(() => {
                    const iframe = document.querySelector(`#${type}-panel iframe`);
                    if (iframe) {
                        iframe.addEventListener('load', () => {
                            const loadTime = performance.now() - startTime;
                            console.log(`⏱️ ${type} iframe loaded in ${loadTime.toFixed(2)}ms`);
                        });
                    }
                }, 100);
            } else {
                originalLoadIframe.call(this, iframeType, src);
            }
        };
        
        console.log(`🎬 Click the ${type} media to measure load time...`);
    };
    
    console.log('\n💡 Tips:');
    console.log('1. Run measureIframeLoad("slides") to measure slide loading time');
    console.log('2. Run measureIframeLoad("video") to measure video loading time');
    console.log('3. Compare with direct browser access to the same URLs');
})(); 