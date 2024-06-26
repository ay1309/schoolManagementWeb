import mongoose from 'mongoose';

const calificacionSchema = new mongoose.Schema({
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
    alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    calificacion: { type: Number, required: true },
});

const Calificacion = mongoose.models.Calificacion || mongoose.model('Calificacion', calificacionSchema);

export default Calificacion;
