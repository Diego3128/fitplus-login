//conexion base de datos
import { pool } from "./database/db.js";

//modulo express
import express, { json } from "express";
//sesion de express
import session from "express-session";
//bcryptjs hashear passwords
import bcryptjs from "bcryptjs";
//modulos para setear paths
import { fileURLToPath } from "url";
import { dirname, join } from "path";

//modulo para comprobar solicitudes
import morgan from "morgan";

//express app configuraciones
const app = express();
app.set("PORT", 3000);

//middlewares
//parsear los datos enviados a través de formularios (POST)
app.use(express.urlencoded({ extended: false }));
//parsear datos enviados a json
app.use(express.json());
//logear tipos de solicitudes al servidor
app.use(morgan("dev"));


//servir directorio public
const __DIR__ = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__DIR__, "public");

app.use("/resources", express.static(publicDir));

//motor de plantillas
app.set("view engine", "ejs");// configurar ejs como motor de plantillas
const viewsDir = join(__DIR__, "views"); //ubicacion de las plantillas
//setear ubicacion de las plantillas
app.set("views", viewsDir);



app.use(session({
    secret: 'clavesecreta', // cadena secreta para firmar la cookie
    resave: false, // No vuelve a guardar la sesión si no ha sido modificada
    saveUninitialized: false, // No guarda una sesión nueva que aún no tenga datos
    cookie: { secure: false }
}));

app.get("/login", (req, res) => {
    res.render('login');
})

app.get("/register", (req, res) => {
    res.render('register', { user: null });
})

//registrar usuario

app.post("/register", async (req, res) => {
    try {
        let { email, userName, password } = req.body;
        email = email.trim();
        userName = userName.trim();
        password = password.trim();


        //comprobar que el correo no exista en la tabla
        const [rows] = await pool.query("SELECT email from users WHERE email = ? ", [email]);

        console.log("----------rows----------");
        console.log(rows);
        console.log(rows.length);
        console.log("-----------------------");
        //si existe un registro el email ya está registrado
        if (rows.length > 0) {
            //retornar la vista 'register.ejs' y una alerta
            return res.render("register", {
                alert: true,
                alertTitle: "Error",
                alertMsg: `El correo ${email}, ya está registrado`,
                alertType: "error",
                user: null
            });
        }
        //en caso de no existir se crea el usuario

        //hashear contraseña usando bcrypt

        const hashedPassword = await bcryptjs.hash(password, 10);

        console.log("------hashedpassword------------");
        console.log(hashedPassword);
        console.log("-----------------------");

        const [result] = await pool.query("INSERT INTO users(email, userName, password) VALUES(?, ?, ?)", [email, userName, hashedPassword]);
        console.log("------Insection RESULT----------");
        console.log(result);
        console.log(result.affectedRows);
        console.log("-----------------------");
        //resivar si se inserto un nuevo registro en la tabla
        if (result.affectedRows > 0) {
            // Se inserto nuevo registro
            //se renderiza la vista 'register.ejs'// se envia objeto con información para la alerta
            return res.render("register", {
                alert: true,
                alertTitle: "Registro exitoso",
                alertMsg: `La cuenta: ${email}, ha sido creada`,
                alertType: "success",
                user: userName
            });
        } else {
            //No se ha insertado un nuevo registro
            //se renderiza la vista 'register.ejs'// se envia objeto con información para la alerta
            return res.render("register", {
                alert: true,
                alertTitle: "Error",
                alertMsg: "No se pudo crear la cuenta. Inténtelo de nuevo.",
                alertType: "error",
                user: null
            });
        }
    } catch (e) {
        //atrapar los errores relacionados a la base de datos y el servidor
        console.log(e);
        //se renderiza la vista 'register.ejs'// se envia objeto con información para la alerta
        res.render("register", {
            alert: true,
            alertTitle: "Error",
            alertMsg: "Algo salio mal intentando crear tu cuenta",
            alertType: "error",
            user: null
        });
    }

})

// autenticar usuario

app.post("/auth", async (req, res) => {
    try {
        let { email, password } = req.body;
        console.log(`---email: ${email}-----password: ${password}----`);

        if (email && password) {
            const [rows] = await pool.query("SELECT email, userName, password from users WHERE email = ? ", [email]);

            console.log("----------rows----------");
            console.log(rows);
            console.log("-----------------------");

            if (rows.length > 0) {
                //comprobar si el password se alinea con el hash en db
                const hashedPassword = rows[0].password;
                console.log(`hashed password: ${hashedPassword}`);

                const result = await bcryptjs.compare(password, hashedPassword);

                console.log(result);

                if (result) {
                    const userName = rows[0].userName;
                    req.session.name = userName;
                    req.session.loggedIn = true;
                    return res.render("login", { info: { email: email, msg: "Todo correcto", loggedIn: true } });
                } else {
                    return res.render("login", { info: { email: null, msg: "Contraseña incorrecta", loggedIn: null } });
                }

            } else {
                return res.render("login", { info: { email: null, msg: `el correo ${email} no existe`, loggedIn: null } });
            }
        }

        return res.render("login", { info: { email: null, msg: "Algo salió mal!", loggedIn: null } });


    } catch (e) {
        //atrapar los errores relacionados a la base de datos y el servidor
        console.log(e);
        //se renderiza la vista 'register.ejs'// se envia objeto con información para la alerta
        return res.render("login", { info: { email: null, msg: "Algo salió mal!", loggedIn: null } });
    }

});

//autenticar paginas mediante sesiones

app.get("/", (req, res) => {
    if (req.session.loggedIn) {
        const data = { loggedIn: true, name: req.session.name }
        return res.render("index", data);
    } else {
        return res.render("login", { user: req.session.name });
    }
})



//iniciar servidor
app.listen(app.get("PORT"), () => {
    console.log(`Running on port: ${app.get("PORT")}`);
})