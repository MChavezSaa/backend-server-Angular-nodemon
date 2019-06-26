//requires
var express= require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var cors= require('cors') ;
//inicializar variables
var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

//CORS middleware
app.use(function(req, res,next){
    //enabling CORS
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-cliente-key, x-cliente-token, x-client-secret, Authorization");
    next();
});

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


app.get('/existeproducto/:id',(req, res, next)=>{
    let id = req.params.id;
    console.log('id '+id);
    mc.query("SELECT * FROM productos WHERE productCode = ?", id, function(error, results,fields){
        return res.send({
            error: false,
            data: results,
            message: 'producto existe'
        });
    });
});

app.delete('/producto/:id', function(req,res){
    //let id = req.body.id;
    let id = req.params.id;
    if(mc){
        mc.query("DELETE FROM productos WHERE productId =?", id, function(error, result){
            if(error){
                return res.status(500).json({"Mensaje": "Error"});
            }else{
                return res.status(200).json({"Mensaje": "Registro con id= "+ id+" borrado"});
            }
        });
    }
});

app.put('/upload/producto/:id',(req,res) =>{
   
     let id= req.params.id;
    console.log(id);
    if(!req.files){
        return res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada',
            errors:{ message: 'Debe de seleccionar una imagen'}
        });
    }
    let archivo = req.files.image;
    let nombreCortado = archivo.name.split('.');
    let extensionArchivo = nombreCortado[nombreCortado.length-1];
    let extensioneValidas = ['png','jpg', 'jpeg', 'gif'];
    if(extensioneValidas.indexOf(extensionArchivo)<0){
        return res.status(400).json({
            ok: false,
            mensaje: 'Extension no valida',
            errors:{message: 'las extensiones validas son '+ extensioneValidas.join(',')}
        });
    }
    let nombreArchivo = `${id}-${new Date().getMilliseconds()}.${extensionArchivo}`;
    let path = `./uploads/productos/${nombreArchivo}`;
    archivo.mv(path, err =>{
        if(err){
            return res.status(500).json({
                ok:false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }
        return res.status(200).json({
            ok:true,
            mensaje:'Peticion realizada correctamente'
        });
    });
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
app.put('/producto/:id', (req, res) => {
    let id = req.params.id;
    let producto = req.body;
    if (!id || !producto) {
        return res.status(400).send({ error: producto, message: 'Debe proveer un id y los datos de un producto' });
    }
    mc.query("UPDATE Productos SET ? WHERE productId = ?", [producto, id], function(error, result, fields) {
        if (error) throw error;
        return res.status(200).json({ "Mensaje": "Registro con id=" + id + "ha sido actualizado" });
    });
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
 });


app.post('/login', (req, res)=>{
    var body = req.body;
    mc.query("SELECT * FROM usuarios WHERE userEmail = ?", body.email, function(error, results, fields){
        if(error){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if(!results){
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }
            console.log(results); 
            if(!bcrypt.compareSync(body.password, results[0].userPassword)){
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Credenciales incorrectas - password',
                    errors: error
                });
            }
            //crear un token 
            let SEED= 'esta-es-una-semilla';
            let token= jwt.sign({usuario: results[0].userPassword},SEED,{expiresIn:14400});
            res.status(200).json({
                ok: true,
                usuario: results,
                id:results[0].userId,
                token: token
            });        
    });
});

app.use('/', (req, res,next)=>{
    let token= req.query.token;
    let SEED = 'esta-es-una-semilla';
    console.log(token);
    jwt.verify(token,SEED,(err,decoded)=>{
        if(err){
            return res.status(401).json({
                ok: false,
                mensaje: 'token incorrecto',
                errors:err
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
});

app.post('/usuario', function(req,res){
    let datosUsuario = {
        //userId: campo auto incremental
        userName: req.body.name,
        userEmail: req.body.email,
        userPassword: bcrypt.hashSync(req.body.password, 10),
        userImg: req.body.img,
        userRole: req.body.role
    }; 
    if(mc){
        mc.query("INSERT INTO usuarios SET ?", datosUsuario, function(error,result){
            if(error){
                return res.status(200).json({
                    ok: false, mensaje:'Error al crear usuario', errors: error
                });
            }else{
                res.status(201).json({
                    ok: true, usuario: result
                });
            }
        });
    }
});
