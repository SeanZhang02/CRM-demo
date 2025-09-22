/**
 * Custom Puppeteer script for mobile-first Lighthouse testing
 * Simulates real mobile device behavior and touch interactions
 */

module.exports = async (page) => {
  // Set mobile viewport and user agent
  await page.setViewport({
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  )

  // Simulate mobile network conditions
  await page.emulateNetworkConditions({
    offline: false,
    downloadThroughput: 1600 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8,     // 750 Kbps
    latency: 150,                         // 150ms RTT
  })

  // Test touch interactions on mobile
  await page.evaluateOnNewDocument(() => {
    // Override touch events to ensure they work properly
    window.addEventListener('touchstart', (e) => {
      console.log('Touch interaction detected:', e.touches.length)
    }, { passive: true })

    // Validate touch target sizes
    const validateTouchTargets = () => {
      const interactiveElements = document.querySelectorAll(
        'button, [role="button"], a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      const invalidTargets = []
      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width < 44 || rect.height < 44) {
          invalidTargets.push({
            element: element.tagName.toLowerCase(),
            size: { width: rect.width, height: rect.height },
            selector: element.className || element.id || 'unknown'
          })
        }
      })

      if (invalidTargets.length > 0) {
        console.warn('Touch targets below 44px minimum:', invalidTargets)
        window.__LIGHTHOUSE_TOUCH_TARGET_VIOLATIONS__ = invalidTargets
      }
    }

    // Run validation after page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', validateTouchTargets)
    } else {
      validateTouchTargets()
    }
  })

  // Test mobile-specific functionality
  await page.evaluateOnNewDocument(() => {
    // Check for mobile-first responsive design
    const checkMobileFirst = () => {
      const viewport = window.innerWidth
      if (viewport < 768) {
        // Mobile viewport - check for mobile-specific styles
        const mobileElements = document.querySelectorAll('[class*="mobile"], [class*="sm:"]')
        console.log('Mobile-specific elements found:', mobileElements.length)

        // Check for proper mobile navigation
        const navigation = document.querySelector('nav, [role="navigation"]')
        if (navigation) {
          const navHeight = navigation.getBoundingClientRect().height
          if (navHeight > 60) {
            console.warn('Navigation height may be too large for mobile:', navHeight)
          }
        }
      }
    }

    window.addEventListener('load', checkMobileFirst)
  })

  // Simulate device orientation changes
  await page.evaluateOnNewDocument(() => {
    // Test orientation change handling
    window.addEventListener('orientationchange', () => {
      console.log('Orientation change detected')

      // Check if layout adapts properly
      setTimeout(() => {
        const layoutShifts = performance.getEntriesByType('layout-shift')
        if (layoutShifts.length > 0) {
          console.log('Layout shifts after orientation change:', layoutShifts.length)
        }
      }, 100)
    })
  })

  // Test scroll performance on mobile
  await page.evaluateOnNewDocument(() => {
    let scrollPerformance = []
    let lastScrollTime = Date.now()

    window.addEventListener('scroll', () => {
      const now = Date.now()
      const timeDiff = now - lastScrollTime
      scrollPerformance.push(timeDiff)
      lastScrollTime = now

      // Alert if scroll performance is poor (>16ms between frames)
      if (timeDiff > 32) {
        console.warn('Poor scroll performance detected:', timeDiff + 'ms')
      }
    }, { passive: true })

    // Report scroll performance after testing
    window.__LIGHTHOUSE_SCROLL_PERFORMANCE__ = () => {
      const avgScrollTime = scrollPerformance.reduce((a, b) => a + b, 0) / scrollPerformance.length
      return {
        averageTime: avgScrollTime,
        measurements: scrollPerformance.length,
        poorFrames: scrollPerformance.filter(time => time > 32).length
      }
    }
  })

  // Test drag-and-drop functionality on mobile
  await page.evaluateOnNewDocument(() => {
    // Check for drag-and-drop elements and their mobile compatibility
    const checkDragElements = () => {
      const draggableElements = document.querySelectorAll('[draggable="true"], .draggable, [data-dnd-kit]')

      draggableElements.forEach((element) => {
        const rect = element.getBoundingClientRect()

        // Check if drag elements are large enough for mobile
        if (rect.width < 56 || rect.height < 56) {
          console.warn('Drag element may be too small for mobile:', {
            element: element.className,
            size: { width: rect.width, height: rect.height }
          })
        }

        // Check for touch-action CSS property
        const touchAction = getComputedStyle(element).touchAction
        if (touchAction === 'auto') {
          console.warn('Drag element should have touch-action: none for mobile:', element.className)
        }
      })
    }

    window.addEventListener('load', checkDragElements)
  })

  // Validate accessibility on mobile
  await page.evaluateOnNewDocument(() => {
    // Check for mobile accessibility considerations
    const checkMobileAccessibility = () => {
      // Check for proper ARIA labels on mobile-specific elements
      const mobileMenus = document.querySelectorAll('[class*="mobile-menu"], [class*="hamburger"]')
      mobileMenus.forEach((menu) => {
        if (!menu.getAttribute('aria-label') && !menu.getAttribute('aria-labelledby')) {
          console.warn('Mobile menu missing accessibility label:', menu.className)
        }
      })

      // Check for proper heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (headings.length === 0) {
        console.warn('No headings found - important for mobile screen readers')
      }

      // Check for proper form labels
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach((input) => {
        const label = document.querySelector(`label[for="${input.id}"]`)
        if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          console.warn('Form input missing label - critical for mobile accessibility:', input.type)
        }
      })
    }

    window.addEventListener('load', checkMobileAccessibility)
  })

  // Set up performance monitoring
  await page.evaluateOnNewDocument(() => {
    // Monitor mobile-specific performance metrics
    window.__LIGHTHOUSE_MOBILE_METRICS__ = {
      touchLatency: [],
      scrollJank: 0,
      layoutShifts: 0
    }

    // Track touch input latency
    let touchStartTime = 0
    document.addEventListener('touchstart', () => {
      touchStartTime = performance.now()
    }, { passive: true })

    document.addEventListener('touchend', () => {
      if (touchStartTime > 0) {
        const latency = performance.now() - touchStartTime
        window.__LIGHTHOUSE_MOBILE_METRICS__.touchLatency.push(latency)
      }
    }, { passive: true })

    // Monitor layout shifts
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          window.__LIGHTHOUSE_MOBILE_METRICS__.layoutShifts += entry.value
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  })

  console.log('Mobile-first Lighthouse testing setup complete')
}