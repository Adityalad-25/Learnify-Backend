import mongoose from 'mongoose';  

const schema = new mongoose.Schema({
   
    razorpay_payment_id  :{
        type: String,
        required:true,
    },
    razorpay_subscription_id:{
        type: String,
        required:true,
    } ,
    razorpay_signature :{
        type:String,
        required:true,
    },

    //createdAt : type . default
    createdAt: {
        type: Date,
        default: Date.now,
    },


});

 export const Payment = mongoose.model( "Payment", schema); 


 

