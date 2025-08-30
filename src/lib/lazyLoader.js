// src/lib/lazyLoader.js
export async function lazyLoad(componentName) {
  const components = {
    'Dashboard': () => import('../components/Dashboard.svelte'),
    'RapoarteAvansate': () => import('../components/RapoarteAvansate.svelte'),
    'PDFImporter': () => import('../components/PDFImporter.svelte'),
    'ReceiptParser': () => import('../components/ReceiptParser.svelte'),
    'GroceryDashboard': () => import('../components/GroceryDashboard.svelte')
  };
  
  if (components[componentName]) {
    const module = await components[componentName]();
    return module.default;
  }
  throw new Error(`Component ${componentName} not found`);
}

// Cache for loaded components to avoid re-importing
const componentCache = new Map();

export async function lazyLoadWithCache(componentName) {
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName);
  }
  
  try {
    const component = await lazyLoad(componentName);
    componentCache.set(componentName, component);
    return component;
  } catch (error) {
    console.error(`Failed to load component ${componentName}:`, error);
    throw error;
  }
}

// Preload specific components in the background
export async function preloadComponent(componentName) {
  try {
    await lazyLoadWithCache(componentName);
    console.log(`Component ${componentName} preloaded successfully`);
  } catch (error) {
    console.warn(`Failed to preload component ${componentName}:`, error);
  }
}

// Preload multiple components
export async function preloadComponents(componentNames) {
  const promises = componentNames.map(name => preloadComponent(name));
  await Promise.allSettled(promises);
}