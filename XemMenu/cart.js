// 1. Lấy dữ liệu giỏ hàng
let cart = JSON.parse(localStorage.getItem("cart") || "{}");

const cartBody = document.getElementById("cart-body");

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}
// 3. Hàm hiển thị giỏ hàng (Có thêm nút Xóa)
function renderCart() {
  if (!cartBody) return;
  cartBody.innerHTML = ""; 
  let stt = 1;
  for (let id in cart) {
    const { name, price, quantity } = cart[id];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${name}</td>
      <td>${quantity}</td>
      <td>${formatVND(price)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="removeItem('${id}')">Xóa</button>
      </td>
    `;
    cartBody.appendChild(tr);
  }


  if (Object.keys(cart).length === 0) {
    cartBody.innerHTML = '<tr><td colspan="5" class="text-center">Giỏ hàng đang trống</td></tr>';
  }
}

// 4. HÀM XÓA MÓN ĂN (Quan trọng)
window.removeItem = function(id) {
  // Xóa món ăn đó khỏi đối tượng cart
  delete cart[id];

  // Lưu lại giỏ hàng mới vào máy (localStorage)
  localStorage.setItem("cart", JSON.stringify(cart));

  // Vẽ lại bảng ngay lập tức để người dùng thấy món đó biến mất
  renderCart();
};

// Chạy hàm khi trang web tải xong
renderCart();