const mysql=require("mysql2");

const db=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"jahnvi_bhandari",
    database:"TutorGo"
});

db.connect((err)=>{
    if(err){
        console.error("MySQL connection failed:",err);
        return;
    }
    console.log("Connected to MySQL database");
});

module.exports=db;