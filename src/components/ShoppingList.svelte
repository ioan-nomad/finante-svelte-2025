<script>
  import { onMount } from 'svelte';
  import { fade, slide, fly } from 'svelte/transition';
  import { groceryInventory } from '../stores/groceryStore.js';
  
  // State management
  let currentList = {
    id: Date.now().toString(),
    name: `Listă ${new Date().toLocaleDateString('ro-RO')}`,
    items: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    isActive: true
  };
  
  let shoppingHistory = [];
  let showAddItemModal = false;
  let showHistoryModal = false;
  let showExportModal = false;
  let activeView = 'current'; // current, history
  
  // Form data for adding items
  let newItem = {
    name: '',
    category: 'Altele',
    store: 'Orice',
    quantity: 1,
    unit: 'buc',
    priority: 'normal',
    notes: ''
  };
  
  // Constants
  const categories = [
    'Lactate', 'Carne', 'Legume', 'Fructe', 'Pâine', 'Băuturi',
    'Conserve', 'Condimente', 'Dulciuri', 'Îngrijire', 'Curățenie', 'Altele'
  ];
  
  const stores = [
    'Orice', 'Kaufland', 'Lidl', 'Carrefour', 'Mega Image', 
    'Auchan', 'Penny', 'Profi', 'Cora', 'Selgros'
  ];
  
  const units = ['buc', 'kg', 'g', 'l', 'ml', 'pachete'];
  const priorities = [
    { value: 'low', label: 'Scăzută', color: '#95a5a6' },
    { value: 'normal', label: 'Normală', color: '#3498db' },
    { value: 'high', label: 'Înaltă', color: '#e74c3c' },
    { value: 'urgent', label: 'Urgentă', color: '#e67e22' }
  ];
  
  onMount(() => {
    loadShoppingData();
    generateFromLowStock();
  });
  
  function loadShoppingData() {
    // Load current list
    const savedCurrent = localStorage.getItem('currentShoppingList');
    if (savedCurrent) {
      currentList = JSON.parse(savedCurrent);
    }
    
    // Load history
    const savedHistory = localStorage.getItem('shoppingHistory');
    if (savedHistory) {
      shoppingHistory = JSON.parse(savedHistory);
    }
  }
  
  function saveShoppingData() {
    localStorage.setItem('currentShoppingList', JSON.stringify(currentList));
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
  }
  
  function generateFromLowStock() {
    if (!$groceryInventory.inventory) return;
    
    const lowStockItems = Object.entries($groceryInventory.inventory)
      .filter(([key, item]) => {
        const currentQuantity = item.quantity || 0;
        const minStock = item.minStock || 5;
        return currentQuantity <= minStock;
      })
      .map(([key, item]) => ({
        id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        category: item.category || 'Altele',
        store: 'Orice',
        quantity: Math.max(1, (item.minStock || 5) - (item.quantity || 0)),
        unit: item.unit || 'buc',
        priority: 'normal',
        notes: `Stoc scăzut (${item.quantity || 0}/${item.minStock || 5})`,
        checked: false,
        addedAt: new Date().toISOString(),
        source: 'auto'
      }));
    
    // Add only items that aren't already in the list
    lowStockItems.forEach(autoItem => {
      const exists = currentList.items.some(item => 
        item.name.toLowerCase() === autoItem.name.toLowerCase()
      );
      if (!exists) {
        currentList.items.push(autoItem);
      }
    });
    
    if (lowStockItems.length > 0) {
      saveShoppingData();
      showNotification(`📋 Adăugate ${lowStockItems.length} produse cu stoc scăzut în listă!`);
    }
  }
  
  function addManualItem() {
    if (!newItem.name.trim()) {
      alert('Introduceți numele produsului!');
      return;
    }
    
    const item = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItem.name.trim(),
      category: newItem.category,
      store: newItem.store,
      quantity: parseFloat(newItem.quantity) || 1,
      unit: newItem.unit,
      priority: newItem.priority,
      notes: newItem.notes.trim(),
      checked: false,
      addedAt: new Date().toISOString(),
      source: 'manual'
    };
    
    currentList.items.push(item);
    saveShoppingData();
    showAddItemModal = false;
    
    // Reset form
    newItem = {
      name: '',
      category: 'Altele',
      store: 'Orice',
      quantity: 1,
      unit: 'buc',
      priority: 'normal',
      notes: ''
    };
    
    showNotification(`✅ "${item.name}" adăugat în listă!`);
  }
  
  function toggleItemChecked(itemId) {
    const item = currentList.items.find(i => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      item.checkedAt = item.checked ? new Date().toISOString() : null;
      saveShoppingData();
    }
  }
  
  function removeItem(itemId) {
    currentList.items = currentList.items.filter(i => i.id !== itemId);
    saveShoppingData();
    showNotification('🗑️ Produs eliminat din listă!');
  }
  
  function clearCheckedItems() {
    if (confirm('Elimini toate produsele bifate din listă?')) {
      const removedCount = currentList.items.filter(i => i.checked).length;
      currentList.items = currentList.items.filter(i => !i.checked);
      saveShoppingData();
      showNotification(`🧹 ${removedCount} produse eliminate din listă!`);
    }
  }
  
  function completeCurrentList() {
    if (currentList.items.length === 0) {
      alert('Lista este goală!');
      return;
    }
    
    if (confirm('Finalizezi lista actuală? Va fi salvată în istoric.')) {
      // Move to history
      const completedList = {
        ...currentList,
        completedAt: new Date().toISOString(),
        isActive: false,
        totalItems: currentList.items.length,
        purchasedItems: currentList.items.filter(i => i.checked).length
      };
      
      shoppingHistory.unshift(completedList);
      
      // Keep only last 50 lists in history
      if (shoppingHistory.length > 50) {
        shoppingHistory = shoppingHistory.slice(0, 50);
      }
      
      // Create new current list
      currentList = {
        id: Date.now().toString(),
        name: `Listă ${new Date().toLocaleDateString('ro-RO')}`,
        items: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
        isActive: true
      };
      
      saveShoppingData();
      showNotification('✅ Listă finalizată și salvată în istoric!');
    }
  }
  
  function loadFromHistory(historyList) {
    if (currentList.items.length > 0) {
      if (!confirm('Lista actuală va fi înlocuită. Continuați?')) {
        return;
      }
    }
    
    currentList = {
      id: Date.now().toString(),
      name: `${historyList.name} (Reîncărcat)`,
      items: historyList.items.map(item => ({
        ...item,
        id: `reload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        checked: false,
        checkedAt: null,
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      completedAt: null,
      isActive: true
    };
    
    saveShoppingData();
    showHistoryModal = false;
    showNotification('📋 Listă reîncărcată!');
  }
  
  function deleteFromHistory(historyId) {
    if (confirm('Ștergi definitiv această listă din istoric?')) {
      shoppingHistory = shoppingHistory.filter(list => list.id !== historyId);
      saveShoppingData();
      showNotification('🗑️ Listă ștearsă din istoric!');
    }
  }
  
  function exportAsText() {
    const listText = generateListText();
    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-cumparaturi-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📄 Listă exportată ca text!');
  }
  
  function exportAsPDF() {
    // Simple PDF generation using window.print
    const printWindow = window.open('', '_blank');
    const listHTML = generateListHTML();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Listă Cumpărături</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            .category { margin-bottom: 20px; }
            .category h2 { color: #3498db; font-size: 18px; margin-bottom: 10px; }
            .item { margin: 5px 0; padding: 8px; border: 1px solid #ecf0f1; }
            .store { color: #7f8c8d; font-size: 12px; }
            .priority-high { border-left: 4px solid #e74c3c; }
            .priority-urgent { border-left: 4px solid #e67e22; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${listHTML}
          <p class="no-print">
            <button onclick="window.print()">🖨️ Print</button>
            <button onclick="window.close()">Închide</button>
          </p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    showNotification('📄 Listă pregătită pentru print/PDF!');
  }
  
  function shareList() {
    const listText = generateListText();
    
    if (navigator.share) {
      navigator.share({
        title: currentList.name,
        text: listText
      }).catch(console.error);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(listText).then(() => {
        showNotification('📋 Listă copiată în clipboard!');
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = listText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('📋 Listă copiată în clipboard!');
      });
    }
  }
  
  function generateListText() {
    let text = `${currentList.name}\n`;
    text += `Creat: ${new Date(currentList.createdAt).toLocaleDateString('ro-RO')}\n\n`;
    
    const groupedByCategory = groupItemsByCategory();
    
    Object.entries(groupedByCategory).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      text += '─'.repeat(category.length) + '\n';
      
      items.forEach(item => {
        const status = item.checked ? '✅' : '☐';
        text += `${status} ${item.name} (${item.quantity} ${item.unit})`;
        if (item.store !== 'Orice') text += ` - ${item.store}`;
        if (item.notes) text += ` - ${item.notes}`;
        text += '\n';
      });
      text += '\n';
    });
    
    return text;
  }
  
  function generateListHTML() {
    const groupedByCategory = groupItemsByCategory();
    
    let html = `<h1>${currentList.name}</h1>`;
    html += `<p>Creat: ${new Date(currentList.createdAt).toLocaleDateString('ro-RO')}</p>`;
    
    Object.entries(groupedByCategory).forEach(([category, items]) => {
      html += `<div class="category">`;
      html += `<h2>${category}</h2>`;
      
      items.forEach(item => {
        const priorityClass = item.priority === 'high' || item.priority === 'urgent' 
          ? `priority-${item.priority}` : '';
        
        html += `<div class="item ${priorityClass}">`;
        html += `<strong>${item.name}</strong> (${item.quantity} ${item.unit})`;
        if (item.store !== 'Orice') {
          html += `<div class="store">📍 ${item.store}</div>`;
        }
        if (item.notes) {
          html += `<div class="store">📝 ${item.notes}</div>`;
        }
        html += `</div>`;
      });
      
      html += `</div>`;
    });
    
    return html;
  }
  
  function groupItemsByCategory() {
    const groups = {};
    
    currentList.items.forEach(item => {
      const category = item.category || 'Altele';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    
    // Sort items within each category by priority and name
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        return a.name.localeCompare(b.name, 'ro-RO');
      });
    });
    
    return groups;
  }
  
  function groupItemsByStore() {
    const groups = {};
    
    currentList.items.forEach(item => {
      const store = item.store || 'Orice';
      if (!groups[store]) {
        groups[store] = [];
      }
      groups[store].push(item);
    });
    
    return groups;
  }
  
  function showNotification(message) {
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }
  
  // Computed values
  $: totalItems = currentList.items.length;
  $: checkedItems = currentList.items.filter(i => i.checked).length;
  $: uncheckedItems = totalItems - checkedItems;
  $: progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  $: groupedByCategory = groupItemsByCategory();
  $: groupedByStore = groupItemsByStore();
  
  // Sort history by creation date (newest first)
  $: sortedHistory = shoppingHistory.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
</script>

<div class="shopping-container" transition:fade>
  <!-- Header Stats -->
  <div class="header-section">
    <div class="list-info">
      <h1>{currentList.name}</h1>
      <div class="list-stats">
        <span class="stat">📋 {totalItems} produse</span>
        <span class="stat">✅ {checkedItems} bifate</span>
        <span class="stat">⏳ {uncheckedItems} rămase</span>
      </div>
    </div>
    
    <div class="action-buttons">
      <button class="btn btn-primary" on:click={() => showAddItemModal = true}>
        ➕ Adaugă produs
      </button>
      <button class="btn btn-secondary" on:click={generateFromLowStock}>
        🔄 Din stoc scăzut
      </button>
      <button class="btn btn-info" on:click={() => showHistoryModal = true}>
        📚 Istoric
      </button>
      <button class="btn btn-success" on:click={() => showExportModal = true} disabled={totalItems === 0}>
        📤 Export
      </button>
    </div>
  </div>
  
  <!-- Progress Bar -->
  {#if totalItems > 0}
    <div class="progress-section" transition:slide>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
      <div class="progress-text">
        {progressPercent.toFixed(0)}% completat ({checkedItems}/{totalItems})
      </div>
    </div>
  {/if}
  
  <!-- View Toggle -->
  <div class="view-toggle">
    <button 
      class="toggle-btn" 
      class:active={activeView === 'current'}
      on:click={() => activeView = 'current'}
    >
      📋 Listă actuală
    </button>
    <button 
      class="toggle-btn" 
      class:active={activeView === 'category'}
      on:click={() => activeView = 'category'}
    >
      📂 Pe categorii
    </button>
    <button 
      class="toggle-btn" 
      class:active={activeView === 'store'}
      on:click={() => activeView = 'store'}
    >
      🏪 Pe magazine
    </button>
  </div>
  
  <!-- Main Content -->
  <div class="main-content">
    {#if totalItems === 0}
      <div class="empty-state" transition:fade>
        <div class="empty-icon">🛒</div>
        <h2>Lista de cumpărături este goală</h2>
        <p>Adaugă produse manual sau generează din stocul cu nivel scăzut.</p>
        <button class="btn btn-primary" on:click={() => showAddItemModal = true}>
          ➕ Adaugă primul produs
        </button>
      </div>
    {:else}
      
      {#if activeView === 'current'}
        <!-- Current List View -->
        <div class="items-grid">
          {#each currentList.items as item (item.id)}
            <div 
              class="item-card" 
              class:checked={item.checked}
              class:priority-high={item.priority === 'high'}
              class:priority-urgent={item.priority === 'urgent'}
              transition:slide
            >
              <div class="item-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={item.checked}
                    on:change={() => toggleItemChecked(item.id)}
                  />
                  <span class="checkmark"></span>
                  <span class="item-name" class:strikethrough={item.checked}>
                    {item.name}
                  </span>
                </label>
                <button class="remove-btn" on:click={() => removeItem(item.id)}>
                  🗑️
                </button>
              </div>
              
              <div class="item-details">
                <span class="quantity">{item.quantity} {item.unit}</span>
                <span class="category">📂 {item.category}</span>
                {#if item.store !== 'Orice'}
                  <span class="store">🏪 {item.store}</span>
                {/if}
                {#if item.priority !== 'normal'}
                  <span class="priority priority-{item.priority}">
                    {priorities.find(p => p.value === item.priority)?.label}
                  </span>
                {/if}
              </div>
              
              {#if item.notes}
                <div class="item-notes">
                  📝 {item.notes}
                </div>
              {/if}
              
              <div class="item-meta">
                <small class="added-date">
                  {item.source === 'auto' ? '🤖' : '✋'} 
                  {new Date(item.addedAt).toLocaleDateString('ro-RO')}
                </small>
                {#if item.checkedAt}
                  <small class="checked-date">
                    ✅ {new Date(item.checkedAt).toLocaleDateString('ro-RO')}
                  </small>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      
      {:else if activeView === 'category'}
        <!-- Category Grouped View -->
        <div class="grouped-view">
          {#each Object.entries(groupedByCategory) as [category, items]}
            <div class="group-section" transition:slide>
              <h3 class="group-header">
                {category} 
                <span class="group-count">({items.length})</span>
              </h3>
              <div class="group-items">
                {#each items as item}
                  <div class="group-item" class:checked={item.checked}>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={item.checked}
                        on:change={() => toggleItemChecked(item.id)}
                      />
                      <span class="checkmark"></span>
                      <span class="item-name" class:strikethrough={item.checked}>
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                    </label>
                    {#if item.store !== 'Orice'}
                      <span class="store">🏪 {item.store}</span>
                    {/if}
                    <button class="remove-btn" on:click={() => removeItem(item.id)}>
                      🗑️
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      
      {:else if activeView === 'store'}
        <!-- Store Grouped View -->
        <div class="grouped-view">
          {#each Object.entries(groupedByStore) as [store, items]}
            <div class="group-section" transition:slide>
              <h3 class="group-header">
                🏪 {store} 
                <span class="group-count">({items.length})</span>
              </h3>
              <div class="group-items">
                {#each items as item}
                  <div class="group-item" class:checked={item.checked}>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={item.checked}
                        on:change={() => toggleItemChecked(item.id)}
                      />
                      <span class="checkmark"></span>
                      <span class="item-name" class:strikethrough={item.checked}>
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                    </label>
                    <span class="category">📂 {item.category}</span>
                    <button class="remove-btn" on:click={() => removeItem(item.id)}>
                      🗑️
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Action Bar -->
  {#if totalItems > 0}
    <div class="action-bar" transition:slide>
      <button class="btn btn-warning" on:click={clearCheckedItems} disabled={checkedItems === 0}>
        🧹 Curăță bifate ({checkedItems})
      </button>
      <button class="btn btn-success" on:click={completeCurrentList}>
        ✅ Finalizează lista
      </button>
    </div>
  {/if}
</div>

<!-- Add Item Modal -->
{#if showAddItemModal}
  <div class="modal-overlay" on:click={() => showAddItemModal = false}>
    <div class="modal" on:click|stopPropagation transition:fly={{y: 50}}>
      <div class="modal-header">
        <h2>➕ Adaugă produs nou</h2>
        <button class="close-btn" on:click={() => showAddItemModal = false}>✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Nume produs *</label>
          <input 
            type="text" 
            bind:value={newItem.name}
            placeholder="ex: Lapte, Pâine, Roșii"
            autofocus
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Cantitate</label>
            <input 
              type="number" 
              bind:value={newItem.quantity}
              min="0.1"
              step="0.1"
            />
          </div>
          
          <div class="form-group">
            <label>Unitate</label>
            <select bind:value={newItem.unit}>
              {#each units as unit}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Categorie</label>
            <select bind:value={newItem.category}>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label>Magazin preferat</label>
            <select bind:value={newItem.store}>
              {#each stores as store}
                <option value={store}>{store}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label>Prioritate</label>
          <select bind:value={newItem.priority}>
            {#each priorities as priority}
              <option value={priority.value}>{priority.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Note (opțional)</label>
          <textarea 
            bind:value={newItem.notes}
            rows="2"
            placeholder="ex: marca preferată, mărime, etc."
          ></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={() => showAddItemModal = false}>
          Anulează
        </button>
        <button class="btn btn-primary" on:click={addManualItem}>
          ✅ Adaugă în listă
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- History Modal -->
{#if showHistoryModal}
  <div class="modal-overlay" on:click={() => showHistoryModal = false}>
    <div class="modal modal-large" on:click|stopPropagation transition:fly={{y: 50}}>
      <div class="modal-header">
        <h2>📚 Istoric liste cumpărături</h2>
        <button class="close-btn" on:click={() => showHistoryModal = false}>✕</button>
      </div>
      
      <div class="modal-body">
        {#if sortedHistory.length === 0}
          <div class="empty-history">
            <p>Nu există liste în istoric.</p>
          </div>
        {:else}
          <div class="history-grid">
            {#each sortedHistory as list}
              <div class="history-card" transition:fade>
                <div class="history-header">
                  <h3>{list.name}</h3>
                  <div class="history-actions">
                    <button class="btn-icon" on:click={() => loadFromHistory(list)} title="Reîncarcă lista">
                      🔄
                    </button>
                    <button class="btn-icon" on:click={() => deleteFromHistory(list.id)} title="Șterge din istoric">
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="history-stats">
                  <span>📅 {new Date(list.createdAt).toLocaleDateString('ro-RO')}</span>
                  <span>📋 {list.totalItems} produse</span>
                  <span>✅ {list.purchasedItems} cumpărate</span>
                </div>
                
                {#if list.completedAt}
                  <div class="completion-date">
                    ✅ Finalizat: {new Date(list.completedAt).toLocaleDateString('ro-RO')}
                  </div>
                {/if}
                
                <div class="history-preview">
                  <h4>Produse:</h4>
                  <div class="preview-items">
                    {#each list.items.slice(0, 5) as item}
                      <span class="preview-item" class:purchased={item.checked}>
                        {item.name}
                      </span>
                    {/each}
                    {#if list.items.length > 5}
                      <span class="preview-more">+{list.items.length - 5} altele</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Export Modal -->
{#if showExportModal}
  <div class="modal-overlay" on:click={() => showExportModal = false}>
    <div class="modal" on:click|stopPropagation transition:fly={{y: 50}}>
      <div class="modal-header">
        <h2>📤 Export listă</h2>
        <button class="close-btn" on:click={() => showExportModal = false}>✕</button>
      </div>
      
      <div class="modal-body">
        <div class="export-options">
          <button class="export-btn" on:click={() => {exportAsText(); showExportModal = false;}}>
            <div class="export-icon">📄</div>
            <div class="export-info">
              <h3>Export ca Text</h3>
              <p>Fișier .txt pentru orice dispozitiv</p>
            </div>
          </button>
          
          <button class="export-btn" on:click={() => {exportAsPDF(); showExportModal = false;}}>
            <div class="export-icon">📄</div>
            <div class="export-info">
              <h3>Print/PDF</h3>
              <p>Printează sau salvează ca PDF</p>
            </div>
          </button>
          
          <button class="export-btn" on:click={() => {shareList(); showExportModal = false;}}>
            <div class="export-icon">📱</div>
            <div class="export-info">
              <h3>Partajează</h3>
              <p>Trimite prin WhatsApp, email, etc.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
.shopping-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.list-info h1 {
  margin: 0 0 10px 0;
  color: var(--ink, #333);
  font-size: 24px;
}

.list-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stat {
  background: var(--panel, white);
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary, #3498db);
  color: white;
}

.btn-secondary {
  background: var(--muted, #95a5a6);
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-success {
  background: var(--success, #28a745);
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.progress-section {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: var(--muted, #666);
}

.view-toggle {
  display: flex;
  background: var(--panel, white);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle-btn {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--primary, #3498db);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.main-content {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--panel, white);
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: var(--ink, #333);
  margin-bottom: 10px;
}

.empty-state p {
  color: var(--muted, #666);
  margin-bottom: 30px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.item-card {
  background: var(--panel, white);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.3s;
  border-left: 4px solid #ecf0f1;
}

.item-card.checked {
  opacity: 0.7;
  transform: scale(0.98);
}

.item-card.priority-high {
  border-left-color: #e74c3c;
}

.item-card.priority-urgent {
  border-left-color: #e67e22;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 24px;
  height: 24px;
  border: 2px solid #bdc3c7;
  border-radius: 6px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: var(--success, #2ecc71);
  border-color: var(--success, #2ecc71);
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.item-name {
  font-weight: 500;
  color: var(--ink, #333);
  transition: all 0.2s;
}

.item-name.strikethrough {
  text-decoration: line-through;
  color: var(--muted, #666);
}

.remove-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ffebee;
  opacity: 1;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.quantity, .category, .store, .priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  background: #f8f9fa;
  color: #495057;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-urgent {
  background: #fff3e0;
  color: #ef6c00;
}

.item-notes {
  font-size: 13px;
  color: var(--muted, #666);
  font-style: italic;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted, #999);
}

.grouped-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-section {
  background: var(--panel, white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.group-header {
  background: var(--primary, #3498db);
  color: white;
  padding: 16px 20px;
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-count {
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: normal;
}

.group-items {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.group-item:last-child {
  border-bottom: none;
}

.group-item.checked {
  opacity: 0.6;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: var(--panel, white);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--panel, white);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--ink, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted, #666);
  padding: 4px;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #ecf0f1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ink, #333);
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary, #3498db);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--panel, white);
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.export-btn:hover {
  border-color: var(--primary, #3498db);
  background: #f8f9fa;
}

.export-icon {
  font-size: 32px;
}

.export-info h3 {
  margin: 0 0 4px 0;
  color: var(--ink, #333);
  font-size: 16px;
}

.export-info p {
  margin: 0;
  color: var(--muted, #666);
  font-size: 14px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.history-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #ecf0f1;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--ink, #333);
}

.history-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: rgba(0,0,0,0.1);
}

.history-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--muted, #666);
  margin-bottom: 12px;
}

.completion-date {
  font-size: 12px;
  color: var(--success, #28a745);
  margin-bottom: 12px;
}

.history-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ink, #333);
}

.preview-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-item {
  padding: 4px 8px;
  background: white;
  border-radius: 12px;
  font-size: 12px;
  color: var(--ink, #333);
}

.preview-item.purchased {
  text-decoration: line-through;
  color: var(--muted, #666);
}

.preview-more {
  padding: 4px 8px;
  background: var(--primary, #3498db);
  color: white;
  border-radius: 12px;
  font-size: 12px;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--muted, #666);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .shopping-container {
    padding: 16px;
  }
  
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .btn {
    min-width: auto;
    flex: 1;
  }
  
  .view-toggle {
    flex-direction: column;
    gap: 4px;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 10px;
    max-width: none;
  }
  
  .history-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    flex-direction: column;
  }
}

/* Dark mode support */
:global(.dark) .item-card,
:global(.dark) .modal,
:global(.dark) .group-section {
  background: #2a2a2a;
  color: #e0e0e0;
}

:global(.dark) .modal-header,
:global(.dark) .modal-footer {
  border-color: #3a3a3a;
}

:global(.dark) input,
:global(.dark) select,
:global(.dark) textarea {
  background: #3a3a3a;
  color: #e0e0e0;
  border-color: #4a4a4a;
}

:global(.dark) .export-btn {
  background: #2a2a2a;
  border-color: #3a3a3a;
  color: #e0e0e0;
}

:global(.dark) .export-btn:hover {
  background: #3a3a3a;
}

:global(.dark) .history-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
}

:global(.dark) .preview-item {
  background: #3a3a3a;
  color: #e0e0e0;
}
</style>