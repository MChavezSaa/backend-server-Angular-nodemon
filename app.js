//requires
var express= require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
//inicializar variables
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//configurar conexion
const mc= mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'',
    database:'angular'
});

mc.connect();


//escuchar peticiones
app.listen(3000, ()=>{
    console.log('Express Server - puerto 3000 online');
});

app.post('/producto', function(req, res){
    let datosProducto ={
        productName: req.body.name,
        productCode: req.body.code,
        releaseDate: req.body.date,
        price: parseInt(req.body.price),
        description: req.body.description,
        starRating: parseInt(req.body.rating),
        imageUrl: req.body.image
    };
    if(mc){
        mc.query("INSERT INTO productos set ?",datosProducto, function (error,result){
            if(error){
                res.status(500).json({"Mensaje": "Error"});
            }else{
                res.status(201).json({"Mensaje": "Insertado"});
            }
        });
    }
});

app.get('/productos',function(req,res){
    mc.query('SELECT * FROM productos', function(error, results, fields){
        if(error) throw error;
        return res.send({
            error: false, data: results, message:'Lista de productos.'
        });
    });
});

app.get('/',(req,res, next)=>{
    res.status(200).json({
        ok: true,
        mensaje: 'Petición realizada correctamente'
    })
} );