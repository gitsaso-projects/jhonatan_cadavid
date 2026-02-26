const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'password',
    port: 5434,
});

pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(45),
        last_name VARCHAR(45),
        telefono VARCHAR(12),
        correo VARCHAR(120) UNIQUE
    )
    `);

app.post('/upload' , upload.single('archivo'), (req, res)=>{
    const rows = [];
    fs.createReadStream(req.file.path)
        .pipe(parse({ columns:true, trim:true}))
        .on('data', row => rows.push(row))
        .on('end', async ()=>{
            try {
                if(rows.length){
                    const values = rows.map(r =>`('${r.name}', '${r.last_name}','${r.telefono}','${r.correo}')`).join(',');
                    await pool.query(`INSERT INTO users (name,last_name,telefono,correo) VALUES ${values} ON CONFLICT (correo) DO NOTHING` );
                }
                res.json({ok: true, total: rows.length});
            } catch{
                res.status(500).json({error:'Eror en la base de datos turtle'});
            }
        });
});

app.listen(3001,()=>{
    console.log('http://localhost:3001');
});

