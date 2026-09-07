const express=require("express");
const router=express.Router();

const db=require("../db");

router.post("/",(req,res)=>{
    const{
        name,email,phone,qualification,experience,price_per_session,rating,location
    }=req.body;
    const sql=`
    INSERT INTO Tutor
    (name,email,phone,qualification,experience,price_per_session,rating,location)
    VALUES(?,?,?,?,?,?,?,?)
    `;
    const values=[
    name,email,phone,qualification,experience,price_per_session,rating || 0,location
    ];
    db.query(sql,values,(err,result)=>{
        if(err){
            console.error(err);
            return res.status(500).json({
                error:"Failed to create tutor"
            });
        }
        res.status(201).json({
            message:"Tutor created successfully",
            tutor_id:result.insertId
        });
    });
});

module.exports=router;