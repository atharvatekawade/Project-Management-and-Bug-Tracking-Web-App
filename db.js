const Pool=require('pg').Pool;
require('dotenv').config();

const devConfig={
    user:process.env.USER,
    password:process.env.PASSWORD,
    host:process.env.HOST,
    port:process.env.POORT,
    database:process.env.DB
};

const proConfig={
    connectionString:process.env.DATABASE_URL
}

if(process.env.NODE_ENV==='production'){
    const pool=new Pool(proConfig);
    module.exports=pool;
}
else{
    const pool=new Pool(devConfig);
    module.exports=pool;
}