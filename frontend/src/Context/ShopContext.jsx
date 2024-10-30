import React, { createContext, useEffect, useState } from "react";
import all_product_local from "../Components/Assets/all_product"; // Import local products

export const ShopContext = createContext(null);

// Initialize the default cart state
const getDefaultCart = (productCount) => {
  let cart = {};
  for (let index = 0; index < productCount; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState({});

  // Fetch products from the API and merge with local products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:4000/allproducts");
        if (!response.ok) throw new Error("Failed to fetch products");
  
        const apiProducts = await response.json();
        const mergedProducts = mergeProducts(apiProducts, all_product_local);
  
        setAll_Product(mergedProducts);
        setCartItems(getDefaultCart(mergedProducts.length));
      } catch (error) {
        console.error("Error fetching products:", error);
  
        // Fallback to local products if the API fails
        setAll_Product(all_product_local);
        setCartItems(getDefaultCart(all_product_local.length));
      }
    };
  
    // Fetch cart data if the user is authenticated
    const fetchCart = async () => {
      const authToken = localStorage.getItem("auth-token");
      if (authToken) {
        try {
          const response = await fetch("http://localhost:4000/getcart", {
            method: "GET", // Changed from POST to GET
            headers: {
              "auth-token": authToken,
              "Content-Type": "application/json", // Updated header
            },
          });
  
          if (!response.ok) throw new Error("Failed to fetch cart data");
          const data = await response.json();
          setCartItems(data);
        } catch (error) {
          console.error("Error fetching cart:", error);
        }
      }
    };
  
    fetchProducts();
    fetchCart(); // Call fetchCart after fetching products
  }, []);

  // Merge API and local products without duplicates
  const mergeProducts = (apiProducts, localProducts) => {
    const merged = [...localProducts];
    apiProducts.forEach((apiProduct) => {
      if (!merged.some((product) => product.id === apiProduct.id)) {
        merged.push(apiProduct);
      }
    });
    return merged;
  };

  // Add item to the cart and sync with the backend if authenticated
  const addToCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      try {
        const response = await fetch("http://localhost:4000/addtocart", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
          body: JSON.stringify({ itemId }),
        });

        if (!response.ok) throw new Error("Failed to add item to cart");

        const data = await response.json();
        console.log("Item added to cart:", data);
      } catch (error) {
        console.error("Error adding item to cart:", error);
      }
    }
  };

  // Remove item from the cart
  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 0) - 1, 0), // Prevent negative values
    }));
    if(localStorage.getItem('auth-token')){
      fetch('http://localhost:4000/removefromcart', {
        method : 'POST',
        headers :{
          Accept : 'application/form-data',
          'auth-token' : `${localStorage.getItem('auth-token')}`,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({"itemId" : itemId}),
      }).then((response)=>response.json())
      .then((data)=>console.log(data));
    }
  };


  const getTotalCartItems = () => {
    let totalItem =0;
    for(const item in cartItems){
      if(cartItems[item] > 0){
        totalItem += cartItems[item];
      }
    }
    return totalItem;
  }
  // Provide context to children components
  const contextValue = { getTotalCartItems, all_product, cartItems, addToCart, removeFromCart };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
