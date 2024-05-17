import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 4000;

const mongoUri = 'mongodb+srv://plskyay1309:w8SEcKM5ghaEAJbB@cluster0.au9yjrx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Log de la URI para verificar que se está cargando correctamente
console.log('Conectando a MongoDB en URI:', mongoUri);

// Conectar a la base de datos MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.set('strictQuery', false); // Agrega esta línea para la advertencia de strictQuery

// Definir un esquema y modelo para el registro de información
const userSchema = new mongoose.Schema({
    name: String,
    password: String,
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

app.get('/', (req, res) => {
    res.redirect('/home'); 
});

app.get('/home', (req, res) => {
    res.render('index', { title: 'Inicio' });
});

// Ruta para la página de registro
app.get('/register', (req, res) => {
    res.render('register', { title: 'Registro' });
});

// Ruta POST para manejar el formulario de registro y almacenar los datos
app.post('/register', async (req, res) => {
    const { name, password } = req.body;
    try {
        const newUser = new User({ name, password });
        await newUser.save();
        res.redirect('/home');
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error al registrar usuario');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
