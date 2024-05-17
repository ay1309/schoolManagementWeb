import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Handlebars from 'handlebars'; // importar Handlebars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 4000;

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

// configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/home'); 
});

+
app.get('/home', (req, res) => {
    res.render('index', { title: 'Inicio' });
});

