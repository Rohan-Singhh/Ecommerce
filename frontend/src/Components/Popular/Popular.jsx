import React, { useState, useEffect } from "react";
import "./Popular.css";
import data_product from "../Assets/data"; // Local products
import Item from "../Item/Item";

const Popular = () => {
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products from API
        const response = await fetch("http://localhost:4000/popular");
        const apiProducts = await response.json();

        // Merge local and API products
        const mergedProducts = [...data_product, ...apiProducts];

        // Set merged products to state
        setPopularProducts(mergedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);

        // If API fails, fall back to local products only
        setPopularProducts(data_product);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="popular">
      <h1>POPULAR IN WOMEN</h1>
      <hr />
      <div className="popular-item">
        {popularProducts.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default Popular;
