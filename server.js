import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 4000;

const mongoUri = 'mongodb+srv://plskyay1309:w8SEcKM5ghaEAJbB@cluster0.au9yjrx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Conectar a la base de datos MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.set('strictQuery', false); // Agrega esta línea para la advertencia de strictQuery

// Definir un esquema y modelo para el registro de información
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    passwordHash: String,
});

const User = mongoose.model('User', userSchema);

Handlebars.registerHelper('section', function(name, options) {
    if (!this._sections) {
        this._sections = {};
    }
    this._sections[name] = options.fn(this);
    return null;
});

app.engine('handlebars', engine({
    defaultLayout: 'main',
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar datos POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar express-session
app.use(session({
    secret: 'your-secret-key', // Clave secreta para firmar la cookie de sesión
    resave: false,
    saveUninitialized: false,
}));

// Middleware para verificar la sesión de usuario
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.user = req.session.user; // Pasar el usuario a las vistas
    }
    next();
});

// Ruta GET para la página principal
app.get('/', (req, res) => {
    res.render('index', { title: 'Inicio', user: res.locals.user });
});

// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
    // Si el usuario ya está autenticado, redirigir a la página principal
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Inicio de sesión' });
});

// Ruta POST para manejar el formulario de inicio de sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).send('Contraseña incorrecta');
        }
        req.session.user = user; // Crear una sesión de usuario
        res.redirect('/');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error al iniciar sesión');
    }
});

// Ruta para la página de registro
app.get('/register', (req, res) => {
    res.render('register', { title: 'Registro' });
});

// Ruta POST para manejar el formulario de registro y almacenar los datos
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('El correo electrónico ya está registrado');
        }
        const passwordHash = bcrypt.hashSync(password, 10);
        const newUser = new User({ name, email, passwordHash });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error al registrar usuario');
    }
});

// Ruta GET para la página principal después de iniciar sesión
app.get('/home', (req, res) => {
    // Redirigir a la página de inicio de sesión si el usuario no está autenticado
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index', { title: 'Inicio', user: res.locals.user });
});

// Implementar una ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
