        const port= 4000;
        const express = require("express");
        const app = express();
        const mongoose = require("mongoose");
        const jwt = require("jsonwebtoken");
        const multer = require("multer");
        const path = require("path");
        const cors = require("cors");
        const { Console, error } = require("console");
        const { type } = require("os");

        app.use(express.json());
        app.use(cors());

        // Database connection with MongoDb
        mongoose.connect("mongodb+srv://Rohan:11223344@Cluster0.hycrb.mongodb.net/e-commerce")

        //API Creation

        app.get("/", (req,res)=>{
            res.send("Express App Is Running");

        });

        // Image Storage Engine
        const storage = multer.diskStorage({
            destination : './upload/images',
            filename:(req,file,cb)=>{
                return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
            }
        })

        const upload  = multer({storage : storage})

        //Creating Upload Endpoint for images

        app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));

        app.post("/upload", upload.single('product'),(req,res)=>{
            res.json({
                success:1,
                image_url : `http://localhost:${port}/images/${req.file.filename}`
            })

        })



        //Schema For Creating products
        const Product = mongoose.model("Products", {
            id:{
                type : Number,
                required : true,
            },
            name:{
                type:String,
                required : true,
            },
            image:{
                type:String,
                required : true,
            },
            category:{
                type:String,
                required : true,
            },
            new_price:{
                type:Number,
                required : true,
            },
            old_price:{
                type:Number,
                required : true,
            },
            date:{
                type:Date,
                default:Date.now,
            },
            available:{
                type:Boolean,
                default:true,
            },
        })


        app.post('/addproduct', async(req,res)=>{

            let products = await Product.find({});
            let id;
            if(products.length > 0){
                let last_product_array= products.slice(-1);
                let last_product = last_product_array[0];
                id = last_product.id+1;
            }
            else{
                id = 1;
            }

            const product = new Product({
                id:id,
                name:req.body.name,
                image:req.body.image,
                category:req.body.category,
                new_price:req.body.new_price,
                old_price:req.body.old_price,
                available:req.body.available, 
            });
            console.log(product);
            await product.save();
            console.log("Product Added Successfully");
            res.json({
                success:true,
                name:req.body.name,
            })

        })



        //Creating API for deleting products
        app.post('/removeproduct', async(req,res)=>{
            await Product.findOneAndDelete({id:req.body.id});
            console.log("Removed Successfully");
            res.json({
                success:true,
                name:req.body.name
            })
        })


        // Creating API for getting all products
        app.get('/allproducts', async(req,res)=>{

            let products = await Product.find({});
            console.log("All Product Fetched");
            res.send(products);
        })


        //Schema creating for USER models
        const Users = mongoose.model('Users',{
            name :{
                type: String,
            },
            email :{
                type: String,
                unique : true,
            },
            password:{
                type: String,
            },
            cartData:{
                type: Object,
            },
            date:{
                type: Date,
                default:Date.now,
            }
        })

        // Creating Endpoint for tregistring thr user
        app.post('/signup', async(req,res)=>{
            let check = await Users.findOne({email:req.body.email});
            if(check){
                return res.status(400).json({success:false, errors:"Email Already Exists"});
            }
            let cart = {};
            for(let i = 0; i < 300;i++){
                cart[i] = 0;
            }
            const user = new Users({
                name:req.body.name,
                email:req.body.email,
                password:req.body.password,
                cartData:cart
            });
            await user.save();
            const data = {
                user:{
                    id : user.id
                }
            }
            const token  = jwt.sign(data,'secret_ecom');
            res.json({success:true, token})
            
        })


        // creating for user login
        app.post('/login', async(req,res)=>{
            let user = await Users.findOne({email:req.body.email});
            if(user){
                const passCompare = req.body.password === user.password;
                if(passCompare){
                    const data ={
                        user:{
                            id : user.id
                        }
                    }
                    const token = jwt.sign(data,'secret_ecom');
                    res.json({success:true, token});
                }
                else{
                    res.json({success:false, errors:"Wrong Password"});   
                }
            }
            else{
                res.json({success:false, errors:"User Not Found"});
            }
        })
            // creating endpoint for new collection data
            app.get('/newcollections',async (req,res)=>{
                let products = await Product.find({});
                let newcollection = products.slice(1).slice(-8);
                console.log("New Collection Fetched");
                res.send(newcollection);
            })

            // creating endpoint for popular in women section
            app.get('/popularinwomen',async (req,res)=>{
                let products = await Product.find({category:"women"});
                let popular_in_women = products.slice(0,4);
                console.log("Popular in women fetched");
                res.send(popular_in_women);
            })

              // Middleware to fetch user details from JWT
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
      return res.status(401).json({ error: "Authentication token missing" });
    }
  
    try {
      const data = jwt.verify(token, 'secret_ecom');
      req.user = data.user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
  };
  
  // Endpoint to add products to cart
  app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Adding product to cart:", req.body.itemId);
  
    try {
      const userData = await Users.findById(req.user.id);
      userData.cartData[req.body.itemId] = 
        (userData.cartData[req.body.itemId] || 0) + 1; // Safe increment
  
      await userData.save();
      res.status(200).send("Item added to cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  // Endpoint to remove products from cart
  app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("Removing product from cart:", req.body.itemId);
  
    try {
      const userData = await Users.findById(req.user.id);
      if (userData.cartData[req.body.itemId] > 0) {
        userData.cartData[req.body.itemId] -= 1;
        await userData.save();
      }
  
      res.status(200).send("Item removed from cart");
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  // Endpoint to fetch cart data
  app.get('/getcart', fetchUser, async (req, res) => {
    console.log("Fetching cart data for user:", req.user.id);
  
    try {
      const userData = await Users.findById(req.user.id);
      res.json(userData.cartData);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

        app.listen(port, (error)=>{
            if(!error){
                console.log("Server Running on Port : " +port);
            }
            else{
                console.log("Error : "+error);
            }

        });


