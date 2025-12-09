document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = window.API_BASE_URL;
  const foodEl = document.querySelector('.food');
  const cartCountEl = document.querySelector('.cart-count');
  const searchForm = document.querySelector('.search-container form');
  const searchInput = document.querySelector('.search-container input[name="query"]');

  let items = [];                         
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');

  function updateCartCount() {
    let total = 0;
    for (const id in cart) {
        total += cart[id]; 
    }
    if (cartCountEl) cartCountEl.textContent = total;
  }

  function formatVND(n) {
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  }

  function makeCard(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.id = item.id;
    div.innerHTML = `
      <img src="${item.img}" class="card-img-top" alt="${item.name}">
      <div class="card-body">
        <h5 class="card-title">${item.name}</h5>
        <p class="card-text">${item.status}</p>
        <div class="gia">${formatVND(item.price)}</div>
        <div class="quantity">
          <button class="qty-btn minus-btn" data-action="minus">-</button>
          <input class="qty-input" type="number" value="1" min="1" readonly>
          <button class="qty-btn plus-btn" data-action="plus">+</button>
        </div>
        <button class="add"> <i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng</button>
      </div>
    `;
    return div;
  }

  function render(list) {
    if (!foodEl) return;
    foodEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(i => frag.appendChild(makeCard(i)));
    foodEl.appendChild(frag);
  }

  async function loadItems() {
    const res = await fetch(`${BASE_URL}/items`);
    const data = await res.json();
    return data;
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function filterAndRender(q){
    let query = '';
    if (q) {
        query = q.trim().toLowerCase();
    }
    if(!query) {
        return render(items);
    }
    const filtered = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemName = (item.name || '').toLowerCase(); 
        if (itemName.includes(query)) {
            filtered.push(item);
        }
    }
    render(filtered);
  }

  foodEl && foodEl.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('qty-btn')) {
      const action = btn.dataset.action;
      const qtyInput = btn.parentElement.querySelector('.qty-input');
      let v = parseInt(qtyInput.value, 10) || 1;
      if (action === 'plus') v++;
      if (action === 'minus') v = Math.max(1, v - 1);
      qtyInput.value = v;
      return;
    }

    if (btn.classList.contains('add')) {
      const card = btn.closest('.card');
      if (!card) return;
      const id = card.dataset.id;
      const qty = parseInt(card.querySelector('.qty-input').value, 10) || 1;
      cart[id] = (cart[id] || 0) + qty;
      saveCart();
      updateCartCount();
      const old = btn.textContent;
      btn.textContent = 'Đã thêm';
      setTimeout(() => btn.textContent = old, 700);
    }
  });

  searchForm && searchForm.addEventListener('submit', e => { e.preventDefault(); filterAndRender(searchInput.value); });
  searchInput && searchInput.addEventListener('input', e => filterAndRender(e.target.value));

  (async function init() {
    items = await loadItems();
    render(items);
    updateCartCount();
  })();
});