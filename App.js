import React, { useState, useEffect } from "react";
import "./App.css";

const TokenBot = "7178365234:AAE-3d0Q5O0duxAAurcoBM2UsXKEeIt4cSk";

const ChatId = "1708923130";

// Компонент для отображения товара
const Product = ({ product, onAddToCart, onEdit, onDelete }) => (
  <div className="product-card">
    {product.image ? (
      <img src={product.image} alt={product.name} />
    ) : (
      <p>Нет изображения</p>
    )}
    <div className="product-info">
      <h3>{product.name}</h3>
      <p>Цена: ${parseFloat(product.price).toFixed(2)}</p>
      <p>Количество на складе: {product.quantity}</p>
      <button className="btn secondary-btn" onClick={() => onAddToCart(product)}>
        Добавить в корзину
      </button>
      <button className="btn edit-btn" onClick={() => onEdit(product)}>
        ✏ Изменить
      </button>
      <button className="btn delete-btn" onClick={() => onDelete(product)}>
        ❌ Удалить
      </button>
    </div>
  </div>
);

const App = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    image: "",
    category: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Все");

  const categories = ["Все", "Кровати", "Столы-Стулья", "Диваны", "Журнальные столы", "кресло", "склад" ];

  // Загрузка данных из localStorage при монтировании компонента
  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem("products")) || [];
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    const savedTotal = JSON.parse(localStorage.getItem("total")) || 0;

    setProducts(savedProducts);
    setCart(savedCart);
    setTotal(savedTotal);

    const stockValue = savedProducts.reduce(
      (sum, product) => sum + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0),
      0
    );
    setTotalStockValue(stockValue);
  }, []);

  // Сохранение данных в localStorage при изменении состояния
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("total", JSON.stringify(total));

    const stockValue = products.reduce(
      (sum, product) => sum + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0),
      0
    );
    setTotalStockValue(stockValue);
  }, [products, cart, total]);

  // Добавление/редактирование товара
  const addProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity || !newProduct.category) {
      alert("Заполните все поля!");
      return;
    }

    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price) || 0,
      quantity: parseInt(newProduct.quantity) || 0,
    };

    if (editIndex !== null) {
      const updatedProducts = products.map((product, index) =>
        index === editIndex ? productData : product
      );
      setProducts(updatedProducts);
      setEditIndex(null);
    } else {
      setProducts([...products, productData]);
    }

    setNewProduct({ name: "", price: "", quantity: "", image: "", category: "Warehouse" });

  };

  // Отправка данных в Telegram бот
  const sendToBot = () => {
    if (cart.length === 0) {
      alert("Корзина пуста. Добавьте товары перед отправкой.");
      return;
    }

    const message =
      cart
        .map(
          (item) =>
            `${item.name} - ${item.quantity} шт. - $${(item.price * item.quantity).toFixed(2)}`
        )
        .join("\n") +
      `\n\nИтого: $${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}`;

    fetch(`https://api.telegram.org/bot${TokenBot}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: ChatId,
        text: message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          alert("Данные успешно отправлены в Telegram!");
          const updatedProducts = products.map((product) => {
            const cartItem = cart.find((item) => item.name === product.name);
            return {
              ...product,
              quantity: product.quantity - (cartItem?.quantity || 0),
            };
          });
          setProducts(updatedProducts);
          setCart([]);
          setTotal(0);
        } else {
          alert("Ошибка при отправке данных в Telegram.");
        }
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        alert("Не удалось отправить данные в Telegram.");
      });
  };

  const addProductToCart = (product) => {
    const existingProduct = cart.find((item) => item.name === product.name);
    if (existingProduct) {
      const updatedCart = cart.map((item) =>
        item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    setTotal(total + parseFloat(product.price));
  };

  // Удаление товара из корзины
  const removeFromCart = (item) => {
    const updatedCart = cart
      .map((cartItem) => {
        if (cartItem.name === item.name) {
          return { ...cartItem, quantity: cartItem.quantity - 1 };
        }
        return cartItem;
      })
      .filter((cartItem) => cartItem.quantity > 0);

    setCart(updatedCart);
    setTotal(total - parseFloat(item.price));

    const updatedProducts = products.map((product) =>
      product.name === item.name ? { ...product, quantity: product.quantity + 1 } : product
    );
    setProducts(updatedProducts);
  };

  // Очистка корзины
  const clearCart = () => {
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.name === product.name);
      return {
        ...product,
        quantity: product.quantity + (cartItem?.quantity || 0),
      };
    });
    setProducts(updatedProducts);
    setCart([]);
    setTotal(0);
  };

  // Редактирование товара
  const editProductHandler = (product) => {
    const productIndex = products.findIndex((p) => p.name === product.name);
    setNewProduct(product);
    setEditIndex(productIndex);
  };

  // Удаление товара
  const deleteProduct = (product) => {
    const updatedProducts = products.filter((p) => p.name !== product.name);
    setProducts(updatedProducts);
  };

  // Фильтрация товаров по категории
  const filteredProducts =
    selectedCategory === "Все"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <div className="app">
      <header className="menu">
        <h1>Магазин Starmobi</h1>
        <div className="menu-right">
          <p>Общая стоимость товаров: ${totalStockValue.toFixed(2)}</p>
          <p>Сумма корзины: ${total.toFixed(2)}</p>
        </div>
      </header>

      <main>
        <section className="add-product">
          <h2>{editIndex !== null ? "Изменить товар" : "Добавить товар"}</h2>
          <div className="form">
            <input
              type="text"
              placeholder="Название товара"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Цена"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              type="number"
              placeholder="Количество"
              value={newProduct.quantity}
              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
            />
            <input
              type="text"
              placeholder="Изображение URL"
              value={newProduct.image}
              onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
            />
            <input
              type="number"
              placeholder="Количество на складе"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button className="btn add-btn" onClick={addProduct}>
              {editIndex !== null ? "Сохранить изменения" : "Добавить"}
            </button>
          </div>
        </section>

        <section className="products">
          <h2>Список товаров</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="product-list">
            {filteredProducts.length ? (
              filteredProducts.map((product, index) => (
                <Product
                  key={index}
                  product={product}
                  onAddToCart={addProductToCart}
                  onEdit={editProductHandler}
                  onDelete={deleteProduct}
                />
              ))
            ) : (
              <p>Товары отсутствуют.</p>
            )}
          </div>
        </section>

        <section className="cart">
          <h2>Корзина</h2>
          {cart.length ? (
            <ul>
              {cart.map((item, index) => (
                <li key={index}>
                  {item.name} x {item.quantity} = $
                  {(item.price * item.quantity).toFixed(2)}
                  <button className="btn delete-btn" onClick={() => removeFromCart(item)}>
                    Убрать
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Корзина пуста</p>
          )}
          <button className="btn clear-btn" onClick={clearCart}>
            Очистить корзину
          </button>
          <button className="btn send-btn" onClick={sendToBot}>
            Отправить в Telegram
          </button>
        </section>
      </main>
    </div>
  );
};

export default App;
