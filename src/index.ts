import dotenv from 'dotenv'
import {app} from './app'
import connectDB  from './db';

dotenv.config({
    path:"./src/.env"
})

// connect database     
connectDB()
.then(()=>
   { app.listen(process.env.PORT || 3000,()=>{
        console.log(`server is running at PORT || ${process.env.PORT}` );
        
    })}
).catch((err)=>{
    console.log(`MongoDB connetion error`,err);
    
} 
)

