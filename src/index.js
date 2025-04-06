import dotenv from "dotenv";
import connectDB from './db/index.js';
import app from "./app.js";
dotenv.config({
    path:'.env'
});

connectDB()
.then(()=>{
    console.log("Database connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error)=>{
    console.log("Error connecting to the database:", error.message);
})
