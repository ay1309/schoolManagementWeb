import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import session from 'express-session';
import User from './models/user.js';
import Materia from './models/materia.js';
import Calificacion from './models/calificaciones.js'; 
import 'select2'; 



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 5000;

// Conexión a MongoDB
const mongoUri = 'mongodb+srv://plskyay1309:gatos1234@cluster0.au9yjrx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Conexión establecida a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión a MongoDB:', err);
});

// Configuración de Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware y configuraciones de Express
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint para manejar las solicitudes de búsqueda de materias por AJAX
app.get('/api/materias', async (req, res) => {
    const { searchTerm } = req.query;

    try {
        let materias;
        if (searchTerm) {
            materias = await Materia.find({ nombre: { $regex: searchTerm, $options: 'i' } }).select('nombre');
        } else {
            materias = await Materia.find().select('nombre');
        }
        res.json(materias);
    } catch (error) {
        console.error('Error al buscar materias:', error);
        res.status(500).send('Error del servidor al buscar materias');
    }
});


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

// Middleware para verificar la sesión de usuario
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};


// Rutas
app.get('/', (req, res) => {
    res.render('index', { title: 'Inicio', user: res.locals.user });
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Inicio de sesión' });
});

app.post('/login', async (req, res) => {
    const { name, password } = req.body;
    try {
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).send('Contraseña incorrecta');
        }
        req.session.user = user;
        res.redirect('/saes');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error del servidor al iniciar sesión');
    }
});


app.get('/saes', requireLogin, (req, res) => {
    res.render('saes', { title: 'SAES', user: req.session.user });
});

app.get('/calificaciones', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const calificaciones = await Calificacion.find({ alumno: req.session.user._id })
            .populate('materia')
            .populate('alumno');

        res.render('calificaciones', {
            title: 'Calificaciones',
            calificaciones: calificaciones
        });
    } catch (error) {
        console.error('Error obteniendo las calificaciones:', error);
        res.status(500).send('Error obteniendo las calificaciones.');
    }
});



app.get('/register', (req, res) => {
    res.render('register', { title: 'Registro' });
});

app.post('/register', async (req, res) => {
    const { name, password } = req.body;

    // Verificar que el nombre y la contraseña no sean undefined o null
    if (!name || !password) {
        return res.status(400).send('El nombre y la contraseña son requeridos');
    }

    try {
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).send('El usuario ya está registrado');
        }
        const passwordHash = bcrypt.hashSync(password, 10);
        const newUser = new User({ name, passwordHash });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error del servidor al registrar usuario');
    }
});

app.get('/loginm', (req, res) => {
    res.render('loginm', { title: 'Inicio de sesión como Profesor' });
});

app.post('/loginm', async (req, res) => {
    const { name, password } = req.body;
    try {
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).send('Contraseña incorrecta');
        }
        req.session.user = user;
        res.redirect('/inicioprofesores');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error del servidor al iniciar sesión');
    }
});

app.get('/inicioprofesores', requireLogin, async (req, res) => {
    try {
        const materias = await Materia.find({ profesor: req.session.user._id });
        res.render('inicioprofesores', { title: 'Inicio Profesores', user: req.session.user, materias });
    } catch (error) {
        console.error('Error al obtener las materias del profesor:', error);
        res.status(500).send('Error del servidor al obtener las materias del profesor');
    }
});



// Ruta para mostrar el formulario de registro de usuario
app.get('/registrarusuario', requireLogin, (req, res) => {
    res.render('registrarusuario', { title: 'Registrar Usuario', errorMessage: null });
});

// Ruta para procesar el registro de usuario
app.post('/registrarusuario', requireLogin, async (req, res) => {
    const { name, password, boleta, carrera } = req.body;

    try {
        // Verificar que se proporciona una contraseña válida
        if (!password) {
            throw new Error('La contraseña es requerida');
        }

        // Verificar si el nombre de usuario ya está registrado
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            throw new Error('El usuario ya está registrado');
        }

        // Crear el hash de la contraseña
        const passwordHash = bcrypt.hashSync(password, 10);

        // Crear un nuevo usuario
        const newUser = new User({
            name,
            passwordHash,
            role: 'alumno',
            studentDetails: { boleta, carrera },
        });
        await newUser.save();
        res.redirect('/inicioprofesores');
    } catch (error) {
        console.error('Error al registrar usuario:', error.message);
        res.render('registrarusuario', { title: 'Registrar Usuario', errorMessage: error.message });
    }
});


app.get('/subircalificaciones', requireLogin, async (req, res) => {
    try {
        const materias = await Materia.find({ profesor: req.session.user._id });
        res.render('subircalificaciones', { title: 'Subir Calificaciones', materias });
    } catch (error) {
        console.error('Error al obtener las materias del profesor:', error);
        res.status(500).send('Error del servidor al obtener las materias del profesor');
    }
});

// Ruta POST para buscar alumnos por boleta y materia por nombre
app.post('/subircalificaciones/buscar', requireLogin, async (req, res) => {
    const { boleta, materiaNombre } = req.body;
    try {
        const alumno = await User.findOne({ 'studentDetails.boleta': boleta });
        const materia = await Materia.findOne({ nombre: { $regex: materiaNombre, $options: 'i' } });
        
        if (!alumno || !materia) {
            return res.status(404).send('Alumno o Materia no encontrados');
        }

        res.render('subircalificaciones', {
            title: 'Subir Calificaciones',
            alumno,
            materia,
            calificacion: null // Inicialmente, no hay calificación
        });
    } catch (error) {
        console.error('Error al buscar alumno o materia:', error);
        res.status(500).send('Error del servidor al buscar alumno o materia');
    }
});

// Ruta POST para asignar calificación a un alumno en una materia específica
app.post('/subircalificaciones/asignarcalificacion', requireLogin, async (req, res) => {
    const { alumnoId, materiaId, calificacion } = req.body;
    try {
        // Verifica si materiaId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(materiaId)) {
            throw new Error('ID de materia inválido');
        }

        // Verificar si ya existe una calificación para ese alumno y materia
        const existingCalificacion = await Calificacion.findOne({ alumno: alumnoId, materia: materiaId });
        if (existingCalificacion) {
            // Si ya existe, actualizar la calificación
            existingCalificacion.calificacion = parseFloat(calificacion);
            await existingCalificacion.save();
        } else {
            // Si no existe, crear una nueva calificación
            const nuevaCalificacion = new Calificacion({
                materia: materiaId,
                alumno: alumnoId,
                calificacion: parseFloat(calificacion),
            });
            await nuevaCalificacion.save();
        }
        res.redirect('/inicioprofesores');
    } catch (error) {
        console.error('Error al asignar calificación:', error);
        res.status(500).send('Error del servidor al asignar calificación');
    }
});




// Ruta para buscar materias por nombre
app.post('/subircalificaciones/buscarMateria', async (req, res) => {
    try {
        const { materiaNombre } = req.body;
        const materias = await Materia.find({ nombre: { $regex: materiaNombre, $options: 'i' } }).exec();
        res.json({ materias });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});


// Ruta POST para asignar calificación a un alumno en una materia específica


// Ruta GET para mostrar el formulario de creación de grupo
app.get('/creargrupo', requireLogin, async (req, res) => {
    try {
        const profesorId = req.session.user._id;
        const alumnos = await User.find({ role: 'alumno' });
        res.render('creargrupo', { title: 'Crear Grupo', alumnos });
    } catch (error) {
        console.error('Error al cargar datos para crear grupo:', error);
        res.status(500).send('Error del servidor al cargar datos para crear grupo');
    }
});

// Ruta POST para procesar la creación del grupo
app.post('/creargrupo', requireLogin, async (req, res) => {
    const { nombreMateria, boleta } = req.body;
    try {
        // Buscar al alumno por número de boleta
        const alumno = await User.findOne({ 'studentDetails.boleta': boleta });
        if (!alumno) {
            throw new Error('No se encontró ningún alumno con esa boleta');
        }

        // Crear un nuevo grupo
        const nuevoGrupo = {
            nombreMateria,
            profesor: req.session.user._id,
            estudiantes: [alumno._id],
        };

        // Guardar el nuevo grupo en la base de datos
        const grupoCreado = await Materia.create(nuevoGrupo);

        res.redirect('/inicioprofesores');
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        res.status(500).send(`Error del servidor al crear el grupo: ${error.message}`);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {b
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/');
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});





// Configuración de Handlebars

